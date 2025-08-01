import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="mb-8">
          <Image
            src="https://res.cloudinary.com/depjz6qgl/image/upload/v1754078769/not-found_wgvf3r.svg"
            alt="Page not found illustration"
            width={300}
            height={300}
            className="mx-auto"
            priority={true}
          />
        </div>
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <p className="mt-4 text-muted-foreground max-w-md">
          Sorry, we could not find the page you are looking for.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
