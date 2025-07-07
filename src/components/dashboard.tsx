"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Users, Star, Gift, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [points, setPoints] = useState(0);
  const [referrals, setReferrals] = useState(0);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching initial data and generating referral code
    const initialPoints = 1250;
    const initialReferrals = 12;
    const initialBonus = 600;

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setReferralCode(code);

    // Animate points
    let currentPoints = 0;
    const pointsInterval = setInterval(() => {
      currentPoints += Math.ceil(Math.random() * (initialPoints / 50));
      if (currentPoints >= initialPoints) {
        setPoints(initialPoints);
        clearInterval(pointsInterval);
      } else {
        setPoints(currentPoints);
      }
    }, 50);

    // Animate referrals
    let currentReferrals = 0;
    const referralsInterval = setInterval(() => {
      currentReferrals++;
      if (currentReferrals >= initialReferrals) {
        setReferrals(initialReferrals);
        clearInterval(referralsInterval);
      } else {
        setReferrals(currentReferrals);
      }
    }, 150);

    // Animate bonus points
    let currentBonus = 0;
    const bonusInterval = setInterval(() => {
      currentBonus += Math.ceil(Math.random() * (initialBonus / 20));
      if (currentBonus >= initialBonus) {
        setBonusPoints(initialBonus);
        clearInterval(bonusInterval);
      } else {
        setBonusPoints(currentBonus);
      }
    }, 100);

    return () => {
      clearInterval(pointsInterval);
      clearInterval(referralsInterval);
      clearInterval(bonusInterval);
    };
  }, []);

  const handleCopy = () => {
    const referralLink = `https://exnus.app/join?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied to clipboard!",
      description: "You can now share your referral link.",
    });
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8 w-full">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">
            Exnus Points
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground border border-dashed border-accent rounded-full px-4 py-2">
            <Wallet className="h-4 w-4 text-accent" />
            <span>0x...a1b2</span>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-3 bg-secondary/30 border-accent/30 shadow-lg shadow-accent/5">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
                <Gift className="text-accent" />
                Your Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-primary">
                {new Intl.NumberFormat().format(points)}{" "}
                <span className="text-3xl text-accent">PTS</span>
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 bg-secondary/30 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-muted-foreground">
                Your Referral Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 bg-background/50 p-3 rounded-lg border border-dashed border-border">
                <p className="text-lg font-mono text-accent flex-grow overflow-x-auto no-scrollbar">
                  {`https://exnus.app/join?ref=${referralCode}`}
                </p>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  <Copy className="h-5 w-5 text-muted-foreground hover:text-accent" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6 md:col-span-1 md:grid-cols-1">
            <Card className="bg-secondary/30 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users /> Total Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{referrals}</p>
              </CardContent>
            </Card>

            <Card className="bg-secondary/30 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Star /> Bonus Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {new Intl.NumberFormat().format(bonusPoints)}
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
