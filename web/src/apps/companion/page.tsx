import { CompanionChat } from '@/components/companion/CompanionChat';

export const metadata = {
  title: 'SOVRYN Companion | PFF — Voice of the People',
  description:
    'Chat with the SOVRYN Companion. Voice-first, multilingual (Pidgin, Yoruba, Igbo, Hausa, English). Your data stays on your bonded device.',
};

export default function CompanionPage() {
  return (
    <main className="min-h-screen">
      <CompanionChat />
    </main>
  );
}
