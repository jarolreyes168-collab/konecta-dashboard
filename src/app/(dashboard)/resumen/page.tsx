import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ResumenPage() {
  redirect('/app.html');
}
