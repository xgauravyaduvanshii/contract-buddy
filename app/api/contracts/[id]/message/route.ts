import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { chatCompletion } from "@/lib/xrouter";
import { ROUTER_MODEL } from "@/lib/chat-modes";

type Clause = { n: number; title: string; text: string };
type Turn = { role: "USER" | "ASSISTANT"; content: string };

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Chat-driven contract drafting: the assistant asks for what's missing and,
// once it has enough, returns a full clause set that gets persisted.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const contract = await db.contract.findFirst({ where: { id, userId: user.id } });
    if (!contract) return fail("Not found", 404);

    const body = await req.json().catch(() => ({}));
    const message = String(body.message || "").trim();
    if (!message) return fail("Message is required");
    if (message.length > 3000) return fail("Message too long");

    const chat = (Array.isArray(contract.chat) ? (contract.chat as Turn[]) : []).slice(-20);
    const profile = await db.builderProfile.findUnique({ where: { userId: user.id } });
    const terms = (profile?.terms || {}) as Record<string, unknown>;
    const business = (profile?.business || {}) as Record<string, unknown>;
    const existingClauses = Array.isArray(contract.clauses) ? (contract.clauses as Clause[]) : [];

    const sys = `You are the ContractBuddy contract builder for Indian freelance designers. You collect requirements through short chat questions, then generate a legally-complete contract.
User defaults from setup (pre-fill, still confirm if relevant): pricing model ${profile?.pricingModel || "FIXED"}, revision rounds ${String(terms.revisionRounds ?? 2)}, termination fee ${String(terms.terminationFee ?? "Advance non-refundable")}, IP transfer ${String(terms.ipTransfer ?? "On final payment")}, late payment ${String(terms.latePenalty ?? "1.5%/month after 7 days")}, feedback window ${String(terms.feedbackWindow ?? "3 business days")}, city ${String(business.city || "not set")}.
Current contract state: title "${contract.title}", client "${contract.client || "unknown"}", ${existingClauses.length ? `already drafted ${existingClauses.length} clauses` : "no clauses yet"}.
Reply with STRICT JSON only (no fences): while you still need information: {"mode":"ask","reply":"one short question, or 2-3 numbered questions","suggestions":["quick reply chip",...]}.
When you have enough to draft (client name, scope, fee, dates/timeline): {"mode":"draft","reply":"a 1-2 sentence summary of what you generated plus a tip that they can adjust via chat","suggestions":["Send for signature",...],"contract":{"title":"...","client":"...","fees":{"fee":number,"gstPct":18,"gst":number,"grand":number,"advance":number,"currency":"INR"},"clauses":[{"n":1,"title":"Parties and Effective Date","text":"..."},... 10-13 clauses covering parties, scope, out-of-scope, timeline, revisions, fees, taxes, late payment, IP, portfolio/credit, termination, governing law, general]}}.
Fees: if GST applies show it separately; grand = fee + gst. Keep clause text professional, plain-English, India-jurisdiction, IT Act 2000 e-signature compliant.`;

    const r = await chatCompletion({
      model: ROUTER_MODEL,
      temperature: 0.5,
      maxTokens: 3200,
      messages: [
        { role: "system", content: sys },
        ...chat.map((t) => ({ role: t.role === "USER" ? ("user" as const) : ("assistant" as const), content: t.content })),
        { role: "user" as const, content: message },
      ],
    });

    const parsed = extractJson(r.content);
    const reply = String(parsed?.reply || r.content.slice(0, 1200) || "Sorry — I couldn't process that. Try again?");
    const suggestions = Array.isArray(parsed?.suggestions) ? (parsed!.suggestions as unknown[]).map((s) => String(s).slice(0, 160)).slice(0, 4) : [];
    const nextChat = ([...chat, { role: "USER", content: message }, { role: "ASSISTANT", content: reply }] as Turn[]).slice(-40);

    let updated = contract;
    if (parsed?.mode === "draft" && parsed.contract) {
      const c = parsed.contract as Record<string, unknown>;
      const clauses = Array.isArray(c.clauses)
        ? (c.clauses as unknown[]).slice(0, 20).map((x, i) => {
            const cl = x as Partial<Clause>;
            return { n: Number(cl.n) || i + 1, title: String(cl.title || `Clause ${i + 1}`).slice(0, 120), text: String(cl.text || "").slice(0, 6000) };
          })
        : undefined;
      const fees = c.fees && typeof c.fees === "object" ? (c.fees as Record<string, unknown>) : null;
      updated = await db.contract.update({
        where: { id },
        data: {
          chat: nextChat,
          suggestions,
          title: typeof c.title === "string" ? c.title.slice(0, 160) : undefined,
          client: typeof c.client === "string" ? c.client.slice(0, 120) : undefined,
          clauses: clauses ?? undefined,
          fees: fees
            ? {
                fee: Number(fees.fee) || 0,
                gstPct: Number(fees.gstPct ?? 18),
                gst: Number(fees.gst) || Math.round((Number(fees.fee) || 0) * (Number(fees.gstPct ?? 18) / 100)),
                grand: Number(fees.grand) || Math.round((Number(fees.fee) || 0) * (1 + Number(fees.gstPct ?? 18) / 100)),
                advance: fees.advance !== undefined ? Number(fees.advance) : undefined,
                currency: typeof fees.currency === "string" ? fees.currency.slice(0, 3) : "INR",
              }
            : undefined,
        },
      });
    } else {
      updated = await db.contract.update({ where: { id }, data: { chat: nextChat, suggestions } });
    }

    return ok({
      reply,
      suggestions,
      mode: parsed?.mode === "draft" ? "draft" : "ask",
      contract: { id: updated.id, title: updated.title, client: updated.client, clauses: updated.clauses, fees: updated.fees, status: updated.status },
    });
  } catch (e) {
    const m = (e as Error).message || "";
    if (/leaked|403|api key/i.test(m)) return fail("The contract assistant needs a working AI key (Admin → Settings).", 502);
    return fail("The contract assistant is unavailable right now.", 502);
  }
}
