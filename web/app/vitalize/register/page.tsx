import { RegisterForm } from '@/components/RegisterForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | PFF — Vitalization',
  description: 'Register your device with hardware-bound biometrics. Born in Lagos. Built for the World.',
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen py-16 px-6 max-w-md mx-auto">
      <header className="text-center mb-12">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#e8c547]">
          Register your device
        </h1>
        <p className="mt-2 text-[#6b6b70] text-sm">
          Create a hardware-bound credential. Face ID, Touch ID, or fingerprint required.
        </p>
      </header>
      <RegisterForm />
    </main>
  );
}
