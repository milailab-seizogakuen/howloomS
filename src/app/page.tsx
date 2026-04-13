import { redirect } from 'next/navigation'

export default async function Home(props: {
  searchParams: Promise<{ code?: string }> | { code?: string };
}) {
  const searchParams = await props.searchParams;

  // もしURLにcodeが含まれている場合は、認証コールバックへリダイレクト
  if (searchParams?.code) {
    redirect(`/auth/callback?code=${searchParams.code}`);
  }

  // それ以外は常にログインページにリダイレクト
  redirect('/login');
}
