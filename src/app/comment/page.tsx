import CommentCreateForm from '@/features/comment/components/comment-create-form';

export default function CommentPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Comments</h1>
      <CommentCreateForm />
      {/* You can add a list of existing comments here */}
    </div>
  );
}
