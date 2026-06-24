import Link from "next/link";
import { LegalShell } from "@/components/landing/LegalShell";

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-[11px] font-mono text-blue-400 shrink-0">{num}</span>
        <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="pl-8 text-sm text-zinc-400 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      subtitle="This policy explains what data CTI Tracker collects, how it is used and stored, and your rights as a user."
      updated="June 2026"
    >
      <Section num="01" title="Information We Collect">
        <p>We collect the minimum data necessary to operate the platform:</p>
        <ul className="mt-2 space-y-2 list-none">
          <li className="flex gap-2">
            <span className="text-blue-400 shrink-0">·</span>
            <span>
              <strong className="text-zinc-300">Google sign-in:</strong> Your display name and email
              address, as provided by Google OAuth 2.0.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 shrink-0">·</span>
            <span>
              <strong className="text-zinc-300">Username / password sign-up:</strong> Your chosen
              username, email address, and a bcrypt-hashed password. Plaintext passwords are never
              stored.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 shrink-0">·</span>
            <span>
              <strong className="text-zinc-300">User-generated content:</strong> Campaigns, watchlist
              entries, IOC annotations, and intelligence reports you create within the platform.
            </span>
          </li>
        </ul>
        <p className="mt-2">
          IOC data ingested from public threat feeds contains no personal information and is not linked
          to your account.
        </p>
      </Section>

      <Section num="02" title="How We Use Your Data">
        <p>
          Your data is used solely to operate the platform — to authenticate you, display your account
          information, and persist your work across sessions. We do not use your data for advertising,
          profiling, or any purpose beyond platform operation.
        </p>
      </Section>

      <Section num="03" title="Data Storage">
        <p>
          All user data is stored in a PostgreSQL database hosted by{" "}
          <strong className="text-zinc-300">Supabase</strong>, a third-party database-as-a-service
          provider. By using CTI Tracker, you acknowledge that your data is processed by Supabase in
          accordance with their{" "}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-zinc-200 underline transition-colors"
          >
            Privacy Policy
          </a>
          .
        </p>
      </Section>

      <Section num="04" title="Cookies">
        <p>
          CTI Tracker uses a single <strong className="text-zinc-300">session cookie</strong> issued by
          NextAuth.js to maintain your authenticated state. This is a strictly necessary functional
          cookie. No analytics, advertising, or third-party tracking cookies are used.
        </p>
      </Section>

      <Section num="05" title="Google OAuth">
        <p>
          If you choose to sign in with Google, your authentication is handled by Google&apos;s OAuth
          2.0 service. By using Google sign-in, you are also subject to{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-zinc-200 underline transition-colors"
          >
            Google&apos;s Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-zinc-200 underline transition-colors"
          >
            Terms of Service
          </a>
          . We only request access to your basic profile (name and email) and do not request access to
          any Google services beyond authentication.
        </p>
      </Section>

      <Section num="06" title="Data Sharing">
        <p>
          We do not sell, rent, trade, or share your personal data with third parties for their own
          purposes. Data is shared only as necessary to operate the platform: Supabase for database
          storage, and Google for OAuth authentication.
        </p>
      </Section>

      <Section num="07" title="Data Retention">
        <p>
          Your account data is retained for as long as your account remains active. To request deletion
          of your account and all associated data, contact the platform administrator.
        </p>
      </Section>

      <Section num="08" title="Your Rights">
        <p>
          Depending on your jurisdiction, you may have rights to access, correct, export, or delete
          your personal data. To exercise any of these rights, contact the platform administrator.
        </p>
      </Section>

      <div className="pt-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600">
          See also:{" "}
          <Link href="/legal/terms" className="text-zinc-500 hover:text-zinc-300 underline transition-colors">
            Terms of Service
          </Link>{" "}
          ·{" "}
          <Link href="/legal/disclaimer" className="text-zinc-500 hover:text-zinc-300 underline transition-colors">
            Intelligence Disclaimer
          </Link>
        </p>
      </div>
    </LegalShell>
  );
}
