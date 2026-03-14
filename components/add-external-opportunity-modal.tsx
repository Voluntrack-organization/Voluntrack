import React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/contexts/AuthContext"
import { submitExternalOpportunity } from "@/lib/firebase/dashboard"
import { toast } from "sonner"
import { CATEGORIES } from "@/lib/preferences"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  organization: z.string().min(1, "Organization is required"),
  date: z.string().min(1, "Date is required"),
  hours: z.coerce.number().min(0.1, "Must be at least 0.1 hours"),
  category: z.string().min(1, "Category is required"),
  reflection: z.string().min(10, "Reflection must be at least 10 characters"),
  contactName: z.string().min(1, "Contact Name is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().optional(),
})

type ExternalOpportunityFormValues = z.infer<typeof formSchema>

interface AddExternalOpportunityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddExternalOpportunityModal({
  open,
  onOpenChange,
  onSuccess,
}: AddExternalOpportunityModalProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<ExternalOpportunityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      organization: "",
      date: "",
      hours: 0,
      category: "",
      reflection: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    },
  })

  async function onSubmit(values: ExternalOpportunityFormValues) {
    if (!user?.uid) {
      toast.error("You must be logged in.")
      return
    }

    setIsSubmitting(true)
    try {
      await submitExternalOpportunity(user.uid, values)
      toast.success("External opportunity logged successfully!")
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error logging external opportunity:", error)
      toast.error("Failed to log opportunity. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto rounded-2xl border-slate-200 shadow-xl fixed top-[110px] sm:top-[120px] translate-y-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">Add External Opportunity</DialogTitle>
          <DialogDescription>
            Log volunteer hours you've completed outside of Voluntrack.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Opportunity Title *</FormLabel>
                  <FormControl>
                    <Input className="rounded-xl border-slate-200 focus-visible:ring-sky-500" placeholder="e.g. Park Cleanup" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Organization Name *</FormLabel>
                  <FormControl>
                    <Input className="rounded-xl border-slate-200 focus-visible:ring-sky-500" placeholder="e.g. City Parks Dept" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Date Completed *</FormLabel>
                    <FormControl>
                      <Input className="rounded-xl border-slate-200 focus-visible:ring-sky-500" type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Hours *</FormLabel>
                    <FormControl>
                      <Input className="rounded-xl border-slate-200 focus-visible:ring-sky-500" type="number" step="0.5" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-slate-200 focus:ring-sky-500">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <FormField
              control={form.control}
              name="reflection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Reflection *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What did you do? What did you learn?" 
                      className="resize-none rounded-xl border-slate-200 focus-visible:ring-sky-500 min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t border-slate-100 pt-5 mt-5">
              <h4 className="font-semibold text-sm mb-4 text-slate-800">Organization Contact</h4>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Contact Name (First and Last) *</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl border-slate-200 focus-visible:ring-sky-500" placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Contact Email *</FormLabel>
                        <FormControl>
                          <Input className="rounded-xl border-slate-200 focus-visible:ring-sky-500" type="email" placeholder="jane@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Contact Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input className="rounded-xl border-slate-200 focus-visible:ring-sky-500" type="tel" placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="rounded-full px-6 border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-full px-6 bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-200 transition-all hover:scale-[1.02]"
              >
                {isSubmitting ? "Submitting..." : "Submit Opportunity"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
