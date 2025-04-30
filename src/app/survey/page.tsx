import SurveyForm from '@/features/survey/components/survey-form';

export default function SurveyPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Company Feedback Survey</h1>
        <p className="text-muted-foreground mb-8">
          Please take a moment to fill out this survey. Your feedback helps us
          improve our services.
        </p>
        <SurveyForm />
      </div>
    </div>
  );
}
