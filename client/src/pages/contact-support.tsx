import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, MessageSquare, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContactSupport() {
  const { toast } = useToast();
  const [emailContent, setEmailContent] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [suggestionTitle, setSuggestionTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a real application, you would connect this to an email API or service
    setTimeout(() => {
      toast({
        title: "Email Sent",
        description: "Your message has been sent to info.native254@gmail.com",
      });
      setEmailContent("");
      setEmailSubject("");
      setIsSubmitting(false);
    }, 800);
  };

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a real application, you would connect this to an email API or service
    setTimeout(() => {
      toast({
        title: "Suggestion Submitted",
        description: "Thank you for your feedback. It has been sent to our development team.",
      });
      setSuggestion("");
      setSuggestionTitle("");
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Contact Support</h1>
        
        <Tabs defaultValue="email" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email Support</TabsTrigger>
            <TabsTrigger value="suggestion">Make a Suggestion</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Support</CardTitle>
                <CardDescription>
                  Send an email to our support team for assistance with any issues you're experiencing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Mail className="h-5 w-5 text-neutral-500" />
                    <span className="text-sm font-medium">info.native254@gmail.com</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input 
                      id="email-subject"
                      placeholder="Brief description of your issue"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email-content">Message</Label>
                    <Textarea 
                      id="email-content"
                      placeholder="Describe your issue in detail..."
                      className="min-h-[150px]"
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Send Email
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="suggestion">
            <Card>
              <CardHeader>
                <CardTitle>Make a Suggestion</CardTitle>
                <CardDescription>
                  Share your ideas to help us improve the payroll system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-neutral-500" />
                    <span className="text-sm">Your suggestion will be sent to our development team</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="suggestion-title">Suggestion Title</Label>
                    <Input 
                      id="suggestion-title"
                      placeholder="Brief title for your suggestion"
                      value={suggestionTitle}
                      onChange={(e) => setSuggestionTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="suggestion-content">Details</Label>
                    <Textarea 
                      id="suggestion-content"
                      placeholder="Describe your suggestion in detail..."
                      className="min-h-[150px]"
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-4 w-4" /> Submit Suggestion
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Additional Support Resources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-md shadow-sm">
              <h3 className="font-medium mb-2">Knowledge Base</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Browse our help documentation for answers to common questions.
              </p>
              <Button variant="outline" className="w-full">View Documentation</Button>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm">
              <h3 className="font-medium mb-2">Live Chat</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Chat with our support team during business hours for immediate assistance.
              </p>
              <Button variant="outline" className="w-full">Start Chat</Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}