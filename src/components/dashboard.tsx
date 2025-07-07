"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Users, Star, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const POINTS_PER_REFERRAL = 1000;
const JOIN_BONUS_FOR_REFEREE = 500;
const INITIAL_POINTS = 1000;

// Helper function to animate numbers from 0 to a target value
const animateValue = (
  setter: React.Dispatch<React.SetStateAction<number>>,
  endValue: number,
  duration: number
) => {
  if (endValue === 0) {
    setter(0);
    return;
  }
  let startTimestamp: number | null = null;
  const step = (timestamp: number) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    setter(Math.floor(progress * endValue));
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
};

export default function Dashboard() {
  const [basePoints, setBasePoints] = useState(0);
  const [referrals, setReferrals] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const { toast } = useToast();
  const { publicKey } = useWallet();

  useEffect(() => {
    if (!publicKey) return;

    const userKey = `user-data-${publicKey.toBase58()}`;
    let userData = JSON.parse(localStorage.getItem(userKey) || "null");

    if (!userData) {
      // New user setup
      const newReferralCode = publicKey.toBase58().substring(0, 8).toUpperCase();
      userData = {
        points: INITIAL_POINTS,
        referrals: 0,
        referralCode: newReferralCode,
      };

      const pendingRefCode = sessionStorage.getItem("pending_referral_code");
      if (pendingRefCode) {
        // User was referred
        userData.points += JOIN_BONUS_FOR_REFEREE;
        
        toast({
          title: "Referral Applied!",
          description: `You've received ${JOIN_BONUS_FOR_REFEREE} bonus points!`,
        });

        // This simulates the backend updating the referrer.
        // It's inefficient but demonstrates the concept for a prototype without a real database.
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('user-data-')) {
            try {
              let referrerData = JSON.parse(localStorage.getItem(key) || "null");
              if (referrerData && referrerData.referralCode === pendingRefCode) {
                referrerData.referrals += 1;
                referrerData.points += POINTS_PER_REFERRAL;
                localStorage.setItem(key, JSON.stringify(referrerData));
                break; // Found and updated referrer
              }
            } catch (e) {
              console.error("Failed to parse or update referrer data", e);
            }
          }
        }
        sessionStorage.removeItem("pending_referral_code");
      }
      localStorage.setItem(userKey, JSON.stringify(userData));
    }

    setReferralCode(userData.referralCode);
    animateValue(setBasePoints, userData.points, 1000);
    animateValue(setReferrals, userData.referrals, 1200);

  }, [publicKey, toast]);

  const handleCopy = () => {
    const referralLink = `https://points.exnus.xyz/join?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied to clipboard!",
      description: "You can now share your referral link.",
    });
  };

  const bonusPoints = referrals * POINTS_PER_REFERRAL;
  const totalPoints = basePoints + bonusPoints;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8 w-full">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">
            Exnus Points
          </h1>
          <WalletMultiButton />
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
                {new Intl.NumberFormat().format(totalPoints)}{" "}
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
                  {`https://points.exnus.xyz/join?ref=${referralCode}`}
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
