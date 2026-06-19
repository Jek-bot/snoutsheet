import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/** Renders a paragraph that may contain **bold**, `code`, and [links](url). */
function RichText({ children }) {
  const parts = []
  let remaining = String(children)
  let key = 0
  const pattern = /\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((.+?)\)/

  let match
  while ((match = pattern.exec(remaining))) {
    if (match.index > 0) parts.push(remaining.slice(0, match.index))
    if (match[1] !== undefined) {
      parts.push(<strong key={key++} className="font-semibold text-navy">{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded-md bg-navy-50 text-navy text-[0.85em] font-mono break-all">
          {match[2]}
        </code>
      )
    } else {
      parts.push(
        <a
          key={key++}
          href={match[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-600 underline underline-offset-2 hover:text-teal-500"
        >
          {match[3]}
        </a>
      )
    }
    remaining = remaining.slice(match.index + match[0].length)
  }
  if (remaining) parts.push(remaining)
  return <>{parts}</>
}

function H2({ children }) {
  return <h2 className="text-xl font-bold text-navy mt-10 mb-3">{children}</h2>
}

function H3({ children }) {
  return <h3 className="text-base font-semibold text-navy mt-6 mb-2">{children}</h3>
}

function P({ children }) {
  return <p className="text-sm text-navy-400 leading-relaxed mb-4"><RichText>{children}</RichText></p>
}

function List({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-2 mb-4 text-sm text-navy-400 leading-relaxed marker:text-navy-200">
      {items.map((item, i) => (
        <li key={i}><RichText>{item}</RichText></li>
      ))}
    </ul>
  )
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-surface py-10 px-6">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <img src="/logo.png" alt="Snoutsheet" className="h-16 w-auto" />
          <Link to="/login" className="btn-ghost text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>

        <div className="card p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-navy mb-2">Snoutsheet Privacy Policy</h1>
          <p className="text-sm text-navy-300 mb-1"><strong className="font-semibold text-navy-400">Effective Date:</strong> June 19, 2026</p>
          <p className="text-sm text-navy-300 mb-6"><strong className="font-semibold text-navy-400">Last Updated:</strong> June 19, 2026</p>

          <P>{`Snoutsheet ("Snoutsheet," "we," "us," or "our") provides a booking and client management platform for pet service providers. This Privacy Policy explains what information we collect, how we use it, and the choices you have, including for clients who use our booking link to view upcoming appointments and pet details.`}</P>
          <P>{`If you have questions about this policy, contact us at privacy@snoutsheet.com.`}</P>

          <H2>1. Information We Collect</H2>

          <H3>1.1 Information You Provide</H3>
          <P>We collect the following information when you or your service provider creates a profile or booking in Snoutsheet:</P>
          <List items={[
            '**Contact information:** name, email address, phone number, mailing address',
            '**Pet information:** pet name(s), and other details about your pet provided to us or your service provider',
            "**Veterinary information:** your vet's name, address, phone number, and vaccine records for your pet(s)",
            '**Booking information:** appointment dates, times, and service types',
            '**Internal notes:** notes that your service provider may record about you, your pet, or a booking, for their own operational use',
          ]} />

          <H3>1.2 Information from Google (If You Connect Your Calendar)</H3>
          <P>If you or your service provider chooses to connect Snoutsheet to a Google Calendar, we request limited permission through Google's OAuth system to create calendar events on your behalf.</P>
          <P>We use the scope `https://www.googleapis.com/auth/calendar.events`, which allows Snoutsheet to **create and manage only the events that Snoutsheet itself creates** on the connected calendar. This is a **one-way sync**: when a booking is created in Snoutsheet, we create a corresponding event on the connected Google Calendar. Snoutsheet:</P>
          <List items={[
            'Does **not** read, view, or access any other existing events on your calendar',
            'Does **not** access other Google Calendars, calendar lists, or sharing settings',
            'Only writes event details related to the specific booking (e.g., date, time, service type, and basic description)',
            'Does not write veterinary records, vaccine information, or internal notes into the Google Calendar event',
          ]} />
          <P>You can disconnect Google Calendar access at any time from your account settings, or by revoking Snoutsheet's access directly through your [Google Account permissions page](https://myaccount.google.com/permissions).</P>

          <H3>1.3 Information Collected Automatically</H3>
          <P>Like most web applications, we may automatically collect limited technical information, such as IP address, browser type, and usage data, to maintain and secure the service.</P>

          <H2>2. How We Use Your Information</H2>
          <P>We use the information described above to:</P>
          <List items={[
            'Create, manage, and display bookings between clients and service providers',
            'Sync booking events to a connected Google Calendar, if enabled',
            'Provide clients with a link to view their upcoming bookings and the pet details we have on file',
            "Maintain accurate records of pet and veterinary information for service providers' use",
            'Communicate with you about bookings, appointments, or account matters',
            'Maintain the security, integrity, and proper functioning of the platform',
          ]} />
          <P>We do **not** sell your personal information, and we do not use Google user data for advertising purposes.</P>

          <H2>3. How We Share Your Information</H2>
          <P>We share information only in the following circumstances:</P>
          <List items={[
            "**With your service provider:** the business or individual you book services with can see the information relevant to your bookings, pets, and notes they've recorded",
            '**With Google:** limited booking event details (date, time, service type, description) are sent to Google Calendar, solely to create the calendar event you\'ve authorized',
            '**With service providers we use to operate Snoutsheet:** including our hosting and database provider (Supabase) and our hosting platform (Vercel), who process data on our behalf under appropriate confidentiality and security obligations',
            '**As required by law:** if required to comply with legal process or to protect the rights, safety, or property of Snoutsheet or others',
          ]} />
          <P>We do not share your information with third parties for their own marketing purposes.</P>

          <H2>4. Client Access Page</H2>
          <P>Clients may be given a unique link to view their own upcoming bookings and the pet details on file with their service provider. This page is intended to be accessible only to the client it was generated for. Do not share this link with others if you wish to keep this information private.</P>

          <H2>5. Data Retention</H2>
          <P>We retain your information for as long as your account or your service provider's account remains active, or as needed to provide the service. You may request deletion of your information at any time by contacting us or your service provider, subject to any legal or operational retention requirements.</P>

          <H2>6. Your Choices and Rights</H2>
          <P>Depending on your location, you may have rights to access, correct, or delete your personal information. To exercise these rights, contact us at privacy@snoutsheet.com or reach out to your service provider directly.</P>
          <P>You can revoke Snoutsheet's access to your Google Calendar at any time via your [Google Account permissions page](https://myaccount.google.com/permissions). Revoking access will stop future booking events from syncing but will not delete events already created.</P>

          <H2>7. Data Security</H2>
          <P>We use reasonable administrative, technical, and physical safeguards designed to protect your information, including secure data storage through our infrastructure provider (Supabase) and encrypted connections (HTTPS) for all data in transit.</P>

          <H2>8. Children's Privacy</H2>
          <P>Snoutsheet is not directed to children under 13, and we do not knowingly collect personal information from children under 13.</P>

          <H2>9. Changes to This Policy</H2>
          <P>We may update this Privacy Policy from time to time. We will post the updated version on this page with a revised "Last Updated" date.</P>

          <H2>10. Contact Us</H2>
          <P>If you have questions about this Privacy Policy or our data practices, contact us at:</P>
          <p className="text-sm text-navy-400 leading-relaxed mb-4">
            <strong className="font-semibold text-navy">Snoutsheet</strong><br />
            privacy@snoutsheet.com
          </p>
        </div>
      </div>
    </div>
  )
}
