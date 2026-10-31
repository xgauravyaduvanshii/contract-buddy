--
-- PostgreSQL database dump
--

\restrict yj3hjZYnysmJ0OdpC9r0aiUGhxcXFRTJkQTdV5HooLwCZkaqEz6QkQqcTAVhvEn

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AttachmentKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AttachmentKind" AS ENUM (
    'FILE',
    'IMAGE'
);


--
-- Name: AuthProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuthProvider" AS ENUM (
    'CREDENTIALS',
    'GOOGLE',
    'GITHUB'
);


--
-- Name: ContractStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContractStatus" AS ENUM (
    'DRAFT',
    'SENT',
    'VIEWED',
    'SIGNED',
    'VOID'
);


--
-- Name: EmailChangeStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmailChangeStatus" AS ENUM (
    'PENDING',
    'VERIFIED',
    'APPROVED',
    'REJECTED'
);


--
-- Name: MessageRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MessageRole" AS ENUM (
    'USER',
    'ASSISTANT',
    'SYSTEM',
    'TOOL'
);


--
-- Name: NoticeKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NoticeKind" AS ENUM (
    'WELCOME',
    'UPDATE',
    'INFO',
    'MAINTENANCE'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'SYSTEM',
    'PROJECT',
    'CONTRACT',
    'AUTH',
    'BILLING',
    'NOTICE'
);


--
-- Name: OtpPurpose; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OtpPurpose" AS ENUM (
    'PASSWORD_RESET',
    'EMAIL_VERIFY',
    'EMAIL_CHANGE'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'ADMIN'
);


--
-- Name: ThreadMode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ThreadMode" AS ENUM (
    'ASK',
    'PLAN',
    'AGENT',
    'EXPERT',
    'AUTO'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    provider public."AuthProvider" NOT NULL,
    "providerAccountId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    scope text
);


--
-- Name: AppSetting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AppSetting" (
    id text NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Attachment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Attachment" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "projectId" text,
    kind public."AttachmentKind" DEFAULT 'FILE'::public."AttachmentKind" NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    "mimeType" text,
    size integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: BuilderProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BuilderProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    niches jsonb,
    "pricingModel" text,
    terms jsonb,
    business jsonb,
    "onboardedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ChatMessage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChatMessage" (
    id text NOT NULL,
    "threadId" text NOT NULL,
    "userId" text NOT NULL,
    role public."MessageRole" NOT NULL,
    content text NOT NULL,
    mode public."ThreadMode",
    thinking text,
    "toolCalls" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    comments jsonb,
    reactions jsonb,
    suggestions jsonb
);


--
-- Name: ChatThread; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChatThread" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "projectId" text,
    title text DEFAULT 'New chat'::text NOT NULL,
    mode public."ThreadMode" DEFAULT 'AUTO'::public."ThreadMode" NOT NULL,
    model text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "archivedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    starred boolean DEFAULT false NOT NULL
);


--
-- Name: Contract; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Contract" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "projectId" text,
    title text NOT NULL,
    client text,
    body jsonb,
    status public."ContractStatus" DEFAULT 'DRAFT'::public."ContractStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    chat jsonb,
    clauses jsonb,
    fees jsonb,
    jurisdiction text DEFAULT 'India'::text,
    "proposalId" text,
    signature jsonb,
    "signedAt" timestamp(3) without time zone,
    suggestions jsonb
);


--
-- Name: DesignSystem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DesignSystem" (
    id text NOT NULL,
    "userId" text,
    name text NOT NULL,
    tokens jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DocTemplate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DocTemplate" (
    id text NOT NULL,
    key text NOT NULL,
    "userId" text,
    kind text NOT NULL,
    badge text,
    name text NOT NULL,
    description text,
    "priceHint" text,
    tone text DEFAULT 'brand'::text NOT NULL,
    tags jsonb,
    sections jsonb DEFAULT '[]'::jsonb NOT NULL,
    fee jsonb,
    terms jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: EmailChangeRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmailChangeRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "newEmail" text NOT NULL,
    "otpHash" text,
    "expiresAt" timestamp(3) without time zone,
    status public."EmailChangeStatus" DEFAULT 'PENDING'::public."EmailChangeStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: EmailTemplate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmailTemplate" (
    id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    html text NOT NULL,
    text text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Memory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Memory" (
    id text NOT NULL,
    "userId" text NOT NULL,
    kind text DEFAULT 'NOTE'::text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    source text DEFAULT 'USER'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Notice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notice" (
    id text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    kind public."NoticeKind" DEFAULT 'INFO'::public."NoticeKind" NOT NULL,
    active boolean DEFAULT false NOT NULL,
    "publishedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    body text,
    type public."NotificationType" DEFAULT 'SYSTEM'::public."NotificationType" NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: OtpToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OtpToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    email text NOT NULL,
    "codeHash" text NOT NULL,
    purpose public."OtpPurpose" NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    attempts integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Plugin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Plugin" (
    id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    enabled boolean DEFAULT true NOT NULL,
    config jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Project; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    goal text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Proposal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Proposal" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "projectId" text,
    title text NOT NULL,
    "clientName" text,
    "projectName" text,
    "logoUrl" text,
    note text,
    "noteAuthor" text,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    fee jsonb,
    sections jsonb DEFAULT '[]'::jsonb NOT NULL,
    offers jsonb,
    terms jsonb,
    style jsonb,
    code text,
    "validUntil" timestamp(3) without time zone,
    "templateKey" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Skill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Skill" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    category text DEFAULT 'general'::text NOT NULL,
    instructions text,
    enabled boolean DEFAULT true NOT NULL,
    global boolean DEFAULT true NOT NULL,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    image text,
    "passwordHash" text,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    provider public."AuthProvider" DEFAULT 'CREDENTIALS'::public."AuthProvider" NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    suspended boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    bio text,
    links jsonb,
    "memoryAutoGen" boolean DEFAULT true NOT NULL,
    "memoryRetrieval" boolean DEFAULT true NOT NULL
);


--
-- Name: UserSkill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserSkill" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "skillId" text NOT NULL,
    "installedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: AppSetting AppSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AppSetting"
    ADD CONSTRAINT "AppSetting_pkey" PRIMARY KEY (id);


--
-- Name: Attachment Attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attachment"
    ADD CONSTRAINT "Attachment_pkey" PRIMARY KEY (id);


--
-- Name: BuilderProfile BuilderProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BuilderProfile"
    ADD CONSTRAINT "BuilderProfile_pkey" PRIMARY KEY (id);


--
-- Name: ChatMessage ChatMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_pkey" PRIMARY KEY (id);


--
-- Name: ChatThread ChatThread_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatThread"
    ADD CONSTRAINT "ChatThread_pkey" PRIMARY KEY (id);


--
-- Name: Contract Contract_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_pkey" PRIMARY KEY (id);


--
-- Name: DesignSystem DesignSystem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DesignSystem"
    ADD CONSTRAINT "DesignSystem_pkey" PRIMARY KEY (id);


--
-- Name: DocTemplate DocTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocTemplate"
    ADD CONSTRAINT "DocTemplate_pkey" PRIMARY KEY (id);


--
-- Name: EmailChangeRequest EmailChangeRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailChangeRequest"
    ADD CONSTRAINT "EmailChangeRequest_pkey" PRIMARY KEY (id);


--
-- Name: EmailTemplate EmailTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailTemplate"
    ADD CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Memory Memory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Memory"
    ADD CONSTRAINT "Memory_pkey" PRIMARY KEY (id);


--
-- Name: Notice Notice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notice"
    ADD CONSTRAINT "Notice_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OtpToken OtpToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OtpToken"
    ADD CONSTRAINT "OtpToken_pkey" PRIMARY KEY (id);


--
-- Name: Plugin Plugin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Plugin"
    ADD CONSTRAINT "Plugin_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: Proposal Proposal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Proposal"
    ADD CONSTRAINT "Proposal_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Skill Skill_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Skill"
    ADD CONSTRAINT "Skill_pkey" PRIMARY KEY (id);


--
-- Name: UserSkill UserSkill_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserSkill"
    ADD CONSTRAINT "UserSkill_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Account_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Account_userId_idx" ON public."Account" USING btree ("userId");


--
-- Name: AppSetting_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AppSetting_key_key" ON public."AppSetting" USING btree (key);


--
-- Name: Attachment_projectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Attachment_projectId_idx" ON public."Attachment" USING btree ("projectId");


--
-- Name: Attachment_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Attachment_userId_idx" ON public."Attachment" USING btree ("userId");


--
-- Name: BuilderProfile_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BuilderProfile_userId_key" ON public."BuilderProfile" USING btree ("userId");


--
-- Name: ChatMessage_threadId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatMessage_threadId_idx" ON public."ChatMessage" USING btree ("threadId");


--
-- Name: ChatThread_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatThread_userId_idx" ON public."ChatThread" USING btree ("userId");


--
-- Name: Contract_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Contract_userId_idx" ON public."Contract" USING btree ("userId");


--
-- Name: DesignSystem_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DesignSystem_userId_idx" ON public."DesignSystem" USING btree ("userId");


--
-- Name: DocTemplate_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DocTemplate_key_key" ON public."DocTemplate" USING btree (key);


--
-- Name: DocTemplate_kind_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DocTemplate_kind_idx" ON public."DocTemplate" USING btree (kind);


--
-- Name: DocTemplate_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DocTemplate_userId_idx" ON public."DocTemplate" USING btree ("userId");


--
-- Name: EmailChangeRequest_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EmailChangeRequest_userId_key" ON public."EmailChangeRequest" USING btree ("userId");


--
-- Name: EmailTemplate_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EmailTemplate_key_key" ON public."EmailTemplate" USING btree (key);


--
-- Name: Memory_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Memory_userId_idx" ON public."Memory" USING btree ("userId");


--
-- Name: Notice_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notice_active_idx" ON public."Notice" USING btree (active);


--
-- Name: Notification_userId_read_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_userId_read_idx" ON public."Notification" USING btree ("userId", read);


--
-- Name: OtpToken_email_purpose_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OtpToken_email_purpose_idx" ON public."OtpToken" USING btree (email, purpose);


--
-- Name: OtpToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OtpToken_userId_idx" ON public."OtpToken" USING btree ("userId");


--
-- Name: Plugin_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Plugin_key_key" ON public."Plugin" USING btree (key);


--
-- Name: Project_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Project_userId_idx" ON public."Project" USING btree ("userId");


--
-- Name: Proposal_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Proposal_userId_idx" ON public."Proposal" USING btree ("userId");


--
-- Name: Session_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Session_token_key" ON public."Session" USING btree (token);


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: Skill_enabled_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Skill_enabled_idx" ON public."Skill" USING btree (enabled);


--
-- Name: Skill_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Skill_slug_key" ON public."Skill" USING btree (slug);


--
-- Name: UserSkill_userId_skillId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UserSkill_userId_skillId_key" ON public."UserSkill" USING btree ("userId", "skillId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Attachment Attachment_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attachment"
    ADD CONSTRAINT "Attachment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Attachment Attachment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attachment"
    ADD CONSTRAINT "Attachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BuilderProfile BuilderProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BuilderProfile"
    ADD CONSTRAINT "BuilderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatMessage ChatMessage_threadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES public."ChatThread"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatMessage ChatMessage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatThread ChatThread_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatThread"
    ADD CONSTRAINT "ChatThread_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChatThread ChatThread_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatThread"
    ADD CONSTRAINT "ChatThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contract Contract_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contract Contract_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DesignSystem DesignSystem_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DesignSystem"
    ADD CONSTRAINT "DesignSystem_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DocTemplate DocTemplate_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocTemplate"
    ADD CONSTRAINT "DocTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmailChangeRequest EmailChangeRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailChangeRequest"
    ADD CONSTRAINT "EmailChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Memory Memory_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Memory"
    ADD CONSTRAINT "Memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OtpToken OtpToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OtpToken"
    ADD CONSTRAINT "OtpToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Project Project_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Proposal Proposal_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Proposal"
    ADD CONSTRAINT "Proposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Proposal Proposal_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Proposal"
    ADD CONSTRAINT "Proposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserSkill UserSkill_skillId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserSkill"
    ADD CONSTRAINT "UserSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES public."Skill"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserSkill UserSkill_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserSkill"
    ADD CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict yj3hjZYnysmJ0OdpC9r0aiUGhxcXFRTJkQTdV5HooLwCZkaqEz6QkQqcTAVhvEn

