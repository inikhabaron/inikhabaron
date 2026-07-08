import { PersonalizedFeed } from '@/components/personalization';

export const metadata = {
  title: 'Personalized Feed | KhabarON',
  description: 'News tailored to your reading interests.',
};

export default function PersonalizedPage() {
  return (
    <main>
      <PersonalizedFeed />
    </main>
  );
}