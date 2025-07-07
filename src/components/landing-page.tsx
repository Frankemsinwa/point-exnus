"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Award, Gift, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">
          Exnus Points Airdrop
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8">
          Connect your wallet to start earning points, climb the leaderboard,
          and unlock exclusive rewards.
        </p>
        <div className="flex justify-center">
          <WalletMultiButton className="text-lg px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-transform transform hover:scale-105" />
        </div>
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
                Redeem points for exclusive airdrops, NFTs, and other special
                rewards in the Exnus ecosystem.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
