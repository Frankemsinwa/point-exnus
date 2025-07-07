"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Award, Gift, Users } from "lucide-react";

const faqs = [
  {
    question: "What is the Exnus Points Airdrop?",
    answer:
      "The Exnus Points Airdrop is a program designed to reward our early supporters and community members. By participating, you can earn points that will be converted into tokens during our official airdrop event.",
  },
  {
    question: "How do I earn points?",
    answer:
      "You can earn points by completing simple tasks like following our social media accounts, joining our community channels, referring new users, and participating in our 24-hour mining sessions.",
  },
  {
    question: "How are the airdrop tokens allocated?",
    answer:
      "Your share of the total airdrop token pool is directly proportional to the number of points you have accumulated. The more points you earn, the larger your token allocation will be.",
  },
  {
    question: "Are multiple accounts allowed?",
    answer:
      "No, creating multiple accounts to farm points is strictly prohibited. We have measures in place to detect such activities, and any users found violating this rule will have their accounts disqualified from the airdrop.",
  },
  {
    question: "When will the airdrop happen?",
    answer:
      "The official date for the airdrop will be announced on our social media channels and in our community groups. Stay tuned for updates!",
  },
];


export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-start bg-background text-foreground p-4 py-20 sm:py-28">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">
          Exnus Points Airdrop
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8">
          Start earning points, climb the leaderboard,
          and unlock exclusive rewards.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <Card className="bg-secondary/50 border-border/50 text-center">
            <CardHeader>
              <div className="mx-auto bg-accent/20 text-accent p-3 rounded-full w-fit">
                <Gift className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl pt-4">Earn Points</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Accumulate points by participating in our ecosystem and
                completing tasks.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-secondary/50 border-border/50 text-center">
            <CardHeader>
              <div className="mx-auto bg-accent/20 text-accent p-3 rounded-full w-fit">
                <Users className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl pt-4">Refer Friends</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Use your unique code to invite friends and earn bonus points for
                each successful referral.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-secondary/50 border-border/50 text-center">
            <CardHeader>
              <div className="mx-auto bg-accent/20 text-accent p-3 rounded-full w-fit">
                <Award className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl pt-4">Claim Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Redeem points for exclusive airdrops, and other special
                rewards in the Exnus ecosystem.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-24 text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-lg text-left hover:no-underline">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
