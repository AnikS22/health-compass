/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "The Ethics Lab"

interface WaitlistConfirmationProps {
  name?: string
}

const WaitlistConfirmationEmail = ({ name }: WaitlistConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're on the waitlist for {SITE_NAME}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>⚡ {SITE_NAME}</Text>
        </Section>
        <Hr style={hr} />
        <Heading style={h1}>
          {name ? `Welcome, ${name}!` : 'Welcome!'}
        </Heading>
        <Text style={text}>
          Thanks for signing up for <strong>{SITE_NAME}</strong>. You've been added to our waitlist for independent learning.
        </Text>
        <Text style={text}>
          We're rolling out access in waves to ensure the best experience for everyone. We'll email you as soon as your spot is ready — hang tight!
        </Text>
        <Section style={infoBox}>
          <Text style={infoText}>
            🎯 <strong>What to expect:</strong> Our team reviews applications within 24–48 hours. Once approved, you'll get full access to interactive ethics lessons powered by AI.
          </Text>
        </Section>
        <Text style={text}>
          In the meantime, feel free to check back anytime by signing in.
        </Text>
        <Text style={footer}>
          — The {SITE_NAME} Team
        </Text>
        <Text style={tagline}>
          Where GenZ shapes the future of ethical AI
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WaitlistConfirmationEmail,
  subject: `You're on the waitlist for ${SITE_NAME}!`,
  displayName: 'Waitlist confirmation',
  previewData: { name: 'Alex' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoText = { fontSize: '18px', fontWeight: 'bold', color: '#e6a817', margin: '0' }
const hr = { borderColor: '#e5e7eb', margin: '16px 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#4a4a5a', lineHeight: '1.6', margin: '0 0 16px' }
const infoBox = { backgroundColor: '#fef9e7', border: '1px solid #f5e6a3', borderRadius: '12px', padding: '16px', margin: '0 0 20px' }
const infoText = { fontSize: '14px', color: '#4a4a5a', lineHeight: '1.5', margin: '0' }
const footer = { fontSize: '14px', color: '#6b7280', margin: '24px 0 8px' }
const tagline = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const, margin: '24px 0 0', fontStyle: 'italic' }
