'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CalendarIcon, StarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { createSurveyResponse } from '../actions/create-survey-response';

// Define the interests options
const interestsOptions = [
  { id: 'product-development', label: 'Product Development' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'customer-support', label: 'Customer Support' },
  { id: 'sales', label: 'Sales' },
  { id: 'research', label: 'Research' },
];

// Define the departments
const departments = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'customer-support', label: 'Customer Support' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'finance', label: 'Finance' },
  { value: 'other', label: 'Other' },
];

// Use the same schema as the server action for client-side validation
const SurveySchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  feedback: z
    .string()
    .max(2000, 'Feedback must be less than 2000 characters')
    .optional(),
  department: z.string().min(1, 'Department is required'),
  experienceLevel: z.string().min(1, 'Experience level is required'),
  isSubscribed: z.boolean().default(false),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  availableDate: z.date({
    required_error: 'Please select a date',
    invalid_type_error: "That's not a date!",
  }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  satisfaction: z.number().min(0).max(5),
});

type FormFields = z.infer<typeof SurveySchema>;

export default function SurveyForm() {
  // Initialize the form with react-hook-form and zod validation
  const form = useForm<FormFields>({
    resolver: zodResolver(SurveySchema),
    defaultValues: {
      fullName: '',
      email: '',
      feedback: '',
      department: '',
      experienceLevel: '',
      isSubscribed: false,
      interests: [],
      availableDate: new Date(),
      agreeToTerms: false,
      satisfaction: 0,
    },
  });

  // Extract isSubmitting from form.formState
  const { isSubmitting } = form.formState;

  // Handle form submission
  async function onSubmit(values: FormFields) {
    try {
      const result = await createSurveyResponse(values);

      if (result.status === 'SUCCESS') {
        toast.success(result.message);
        form.reset();
      } else {
        toast.error(result.message || 'Failed to submit survey');

        // Handle field errors
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof FormFields, {
                type: 'manual',
                message: errors[0],
              });
            }
          });
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    }
  }

  return (
    <div className="w-full bg-card rounded-lg shadow p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Text Input - Full Name */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormDescription>
                  Please enter your full name as it appears on official
                  documents.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email Input */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john.doe@example.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Well never share your email with anyone else.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Select - Department */}
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map(department => (
                      <SelectItem
                        key={department.value}
                        value={department.value}
                      >
                        {department.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the department you currently work in.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Radio Group - Experience Level */}
          <FormField
            control={form.control}
            name="experienceLevel"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Experience Level</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="beginner" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Beginner (0-1 years)
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="intermediate" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Intermediate (1-3 years)
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="advanced" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Advanced (3-5 years)
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="expert" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Expert (5+ years)
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Checkbox Group - Interests */}
          <FormField
            control={form.control}
            name="interests"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Areas of Interest</FormLabel>
                  <FormDescription>
                    Select all areas youre interested in learning more about.
                  </FormDescription>
                </div>
                {interestsOptions.map(interest => (
                  <FormField
                    key={interest.id}
                    control={form.control}
                    name="interests"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={interest.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(interest.id)}
                              onCheckedChange={checked => {
                                return checked
                                  ? field.onChange([
                                      ...field.value,
                                      interest.id,
                                    ])
                                  : field.onChange(
                                      field.value?.filter(
                                        value => value !== interest.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {interest.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Picker */}
          <FormField
            control={form.control}
            name="availableDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Available Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-[240px] pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={date =>
                        date < new Date() ||
                        date >
                          new Date(
                            new Date().setMonth(new Date().getMonth() + 6)
                          )
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When would you be available to start a new project?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Textarea - Feedback */}
          <FormField
            control={form.control}
            name="feedback"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Feedback</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share any additional thoughts or feedback..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your feedback helps us improve our services.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Satisfaction Rating */}
          <FormField
            control={form.control}
            name="satisfaction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overall Satisfaction</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    {[0, 1, 2, 3, 4, 5].map(rating => (
                      <Button
                        key={rating}
                        type="button"
                        variant={field.value >= rating ? 'default' : 'outline'}
                        size="icon"
                        className={cn(
                          'h-10 w-10 rounded-full',
                          field.value >= rating
                            ? 'bg-primary text-primary-foreground'
                            : ''
                        )}
                        onClick={() => field.onChange(rating)}
                      >
                        <StarIcon className="h-5 w-5" />
                        <span className="sr-only">{rating} stars</span>
                      </Button>
                    ))}
                  </div>
                </FormControl>
                <FormDescription>
                  Rate your overall satisfaction with our services.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Switch - Newsletter Subscription */}
          <FormField
            control={form.control}
            name="isSubscribed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Newsletter Subscription
                  </FormLabel>
                  <FormDescription>
                    Receive updates about new products and features.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Checkbox - Terms and Conditions */}
          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>I agree to the terms and conditions</FormLabel>
                  <FormDescription>
                    You must agree to our terms and conditions to continue.
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Survey'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
