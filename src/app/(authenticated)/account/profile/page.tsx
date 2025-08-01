import Image from 'next/image';
import Link from 'next/link';

export default function ProfilePage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="mb-8">
          <Image
            src="https://res.cloudinary.com/depjz6qgl/image/upload/v1754076783/robot_qaz7he.svg"
            alt="Robot under construction"
            width={200}
            height={200}
            className="mx-auto"
          />
        </div>
        <h1 className="text-4xl font-bold text-muted-foreground">Profile</h1>
        <h2 className="mt-4 text-2xl font-semibold">
          This page is currently being worked on
        </h2>
        <p className="mt-2 text-muted-foreground">
          We&apos;re working hard to bring you an amazing profile experience.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
