import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#12181B',
      fontFamily: 'Manrope, sans-serif',
      color: 'white',
      padding: '24px 20px 48px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '32px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: '#00B4D8',
            cursor: 'pointer',
            fontSize: '16px',
            padding: 0
          }}
        >
          ← Back
        </button>
      </div>

      <h1 style={{
        fontSize: '24px',
        fontWeight: '800',
        marginBottom: '8px',
        color: '#00B4D8'
      }}>
        Terms of Service
      </h1>
      <p style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: '13px',
        marginBottom: '32px'
      }}>
        Last updated: January {year}
      </p>

      {/* Terms Content */}
      <div style={{
        lineHeight: '1.7',
        fontSize: '14px',
        color: 'rgba(255,255,255,0.75)',
        maxWidth: '640px'
      }}>

        <Section title="1. Acceptance of Terms">
          By downloading, installing, or using PeakLap
          ("the App", "the Service"), you agree to be bound
          by these Terms of Service ("Terms"). If you do not
          agree to these Terms, do not use PeakLap.
          These Terms apply to all users of the App,
          including the web version at peaklap.com and
          the Android application.
        </Section>

        <Section title="2. Description of Service">
          PeakLap is a recreational activity logging
          application designed to help skiers and
          snowboarders track their runs, vertical footage,
          and season statistics for personal enjoyment
          and record-keeping purposes only.
          PeakLap is strictly a personal logging and
          statistics tool. It is NOT:
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>A safety application</li>
            <li>An emergency response service</li>
            <li>A real-time location tracking service</li>
            <li>A navigation tool</li>
            <li>A substitute for proper mountain safety
                equipment or training</li>
            <li>An avalanche warning or detection service</li>
            <li>A medical or fitness advice service</li>
          </ul>
        </Section>

        <Section title="3. Assumption of Risk">
          Skiing, snowboarding, and other mountain activities
          are inherently dangerous sports that carry
          significant risks of injury or death. By using
          PeakLap you acknowledge and agree that:
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>You voluntarily assume all risks associated
                with skiing, snowboarding, and mountain
                activities</li>
            <li>PeakLap has no responsibility for your
                physical safety on the mountain</li>
            <li>The App does not monitor your location
                in real time and cannot be used to
                locate you in an emergency</li>
            <li>You are solely responsible for your own
                safety and the safety of those in your
                group</li>
            <li>You should always follow resort rules,
                ski patrol instructions, and posted
                warning signs</li>
            <li>Trail difficulty ratings shown in the App
                are for reference only and may not reflect
                current conditions</li>
          </ul>
        </Section>

        <Section title="4. Limitation of Liability">
          To the maximum extent permitted by applicable law,
          PeakLap and its owners, developers, employees,
          and affiliates shall not be liable for any:
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Personal injury, death, or property damage
                arising from mountain or ski activities</li>
            <li>Inaccurate trail maps, run information,
                or difficulty ratings</li>
            <li>Loss of data, app downtime, or service
                interruptions</li>
            <li>Decisions made based on information
                displayed in the App</li>
            <li>Indirect, incidental, special, consequential,
                or punitive damages</li>
            <li>Errors or omissions in resort or run data</li>
          </ul>
          In no event shall PeakLap's total liability exceed
          the amount you paid for the Service in the twelve
          months preceding the claim, or $10 CAD if you
          have not made any payments.
        </Section>

        <Section title="5. Accuracy of Information">
          Trail maps, run names, difficulty ratings, vertical
          footage, and resort information displayed in PeakLap
          are provided for general reference and entertainment
          purposes only. This information:
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>May not reflect current mountain conditions</li>
            <li>May be outdated, incomplete, or inaccurate</li>
            <li>Should never be used as the sole basis
                for making safety decisions on the mountain</li>
            <li>Is not verified in real time</li>
          </ul>
          Always consult official resort resources, ski
          patrol, and current conditions reports before
          skiing any terrain.
        </Section>

        <Section title="6. Not a Location Service">
          PeakLap may request access to your device location
          solely for the purpose of automatically detecting
          which ski resort you are at to improve your
          experience. PeakLap does NOT:
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Track your real-time location continuously</li>
            <li>Store your GPS coordinates</li>
            <li>Share your location with third parties</li>
            <li>Provide your location to emergency services</li>
            <li>Monitor your movements on the mountain</li>
          </ul>
          In an emergency, always call 911 or your local
          emergency services. Do not rely on PeakLap
          to summon help.
        </Section>

        <Section title="7. User Accounts">
          You are responsible for:
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Maintaining the security of your account
                credentials</li>
            <li>All activity that occurs under your account</li>
            <li>Providing accurate information when
                creating your account</li>
            <li>Notifying us immediately of any unauthorised
                use of your account</li>
          </ul>
          You must be 13 years of age or older to use
          PeakLap. By creating an account you confirm
          you meet this age requirement.
        </Section>

        <Section title="8. Acceptable Use">
          You agree not to:
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Use the App for any unlawful purpose</li>
            <li>Attempt to access other users' data</li>
            <li>Reverse engineer or copy the App</li>
            <li>Use the App to transmit spam or
                malicious content</li>
            <li>Interfere with the App's servers
                or infrastructure</li>
            <li>Create false or misleading accounts</li>
          </ul>
        </Section>

        <Section title="9. Subscriptions and Payments">
          PeakLap offers free and paid subscription tiers.
          For paid subscriptions:
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Payments are processed securely through
                Stripe (web) or Google Play (Android)</li>
            <li>Subscriptions automatically renew unless
                cancelled before the renewal date</li>
            <li>Refunds are subject to the refund policy
                of the payment platform used</li>
            <li>PeakLap reserves the right to change
                pricing with 30 days notice</li>
            <li>Lifetime subscriptions grant access for
                as long as the App remains in operation</li>
          </ul>
        </Section>

        <Section title="10. Intellectual Property">
          All content, design, code, trademarks, and
          materials within PeakLap are owned by or
          licensed to PeakLap. You may not copy,
          reproduce, distribute, or create derivative
          works from any part of the App without
          express written permission.
          Your personal run logs and data remain yours.
          You grant PeakLap a limited licence to store
          and process this data solely to provide
          the Service.
        </Section>

        <Section title="11. Data and Privacy">
          Your use of PeakLap is also governed by our
          Privacy Policy available at peaklap.com/privacy.
          By using the App you consent to the collection
          and use of your data as described in the
          Privacy Policy.
        </Section>

        <Section title="12. Service Availability">
          PeakLap is provided on an "as is" and
          "as available" basis. We do not guarantee:
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Uninterrupted access to the Service</li>
            <li>That the Service will be error-free</li>
            <li>That data will never be lost</li>
            <li>That the Service will continue
                indefinitely</li>
          </ul>
          We reserve the right to modify, suspend,
          or discontinue the Service at any time
          with reasonable notice where possible.
        </Section>

        <Section title="13. Modifications to Terms">
          PeakLap reserves the right to update these
          Terms at any time. We will notify users of
          material changes via email or in-app
          notification. Continued use of the App after
          changes constitutes acceptance of the
          updated Terms.
        </Section>

        <Section title="14. Governing Law">
          These Terms are governed by and construed in
          accordance with the laws of the Province of
          Quebec, Canada, without regard to conflict
          of law principles. Any disputes arising from
          these Terms shall be resolved in the courts
          of Quebec, Canada.
        </Section>

        <Section title="15. Contact">
          For questions about these Terms please contact:
          <br /><br />
          PeakLap<br />
          peaklap.com<br />
          Via the feedback form at peaklap.com
        </Section>

        <p style={{
          marginTop: '40px',
          padding: '16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.4)',
          borderLeft: '3px solid #00B4D8'
        }}>
          By using PeakLap you acknowledge that you have
          read, understood, and agree to be bound by
          these Terms of Service.
        </p>

        <p style={{
          marginTop: '24px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.3)'
        }}>
          © {year} PeakLap. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// Reusable section component
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h2 style={{
        fontSize: '15px',
        fontWeight: '700',
        color: 'white',
        marginBottom: '8px'
      }}>
        {title}
      </h2>
      <div>{children}</div>
    </div>
  );
}
