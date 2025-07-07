"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Copy, Users, Star, Gift, CheckCircle2, Loader2, Play } from "lucide-react";

type TaskName = 'x' | 'telegram' | 'discord';

interface DashboardContentProps {
    onboardingStep: 'tasks' | 'activate' | 'dashboard';
    tasksCompleted: Record<TaskName, boolean>;
    verifyingTask: TaskName | null;
    TASK_ICONS: Record<TaskName, React.ReactNode>;
    TASKS: Record<TaskName, { name: string; cta: string; }>;
    handleVerifyTask: (taskName: TaskName) => void;
    isActivating: boolean;
    handleActivateMining: () => void;
    minedPoints?: number;
    MINING_REWARD?: number;
    timeRemaining?: number;
    formatTime?: (seconds: number) => string;
    totalPoints?: number;
    referralCode?: string;
    handleCopy?: () => void;
    referralCount?: number;
    POINTS_PER_REFERRAL?: number;
}

const TasksView = ({ tasksCompleted, verifyingTask, TASK_ICONS, TASKS, handleVerifyTask }: Pick<DashboardContentProps, 'tasksCompleted' | 'verifyingTask' | 'TASK_ICONS' | 'TASKS' | 'handleVerifyTask'>) => (
    <div className="w-full text-center mt-8 animate-in fade-in-50">
        <h2 className="text-4xl font-bold mb-4">Almost there!</h2>
        <p className="text-muted-foreground mb-12">Complete these tasks to proceed.</p>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {(Object.keys(TASKS) as TaskName[]).map((taskName) => {
                const task = TASKS[taskName];
                const isCompleted = tasksCompleted[taskName];
                const isVerifying = verifyingTask === taskName;
                const isDisabled = isCompleted || !!verifyingTask;

                return (
                    <Card key={taskName} className="bg-secondary/30 border-border/50 text-center flex flex-col">
                        <CardHeader>
                            <div className="mx-auto bg-accent/20 text-accent p-3 rounded-full w-fit">
                                {TASK_ICONS[taskName]}
                            </div>
                            <CardTitle className="text-2xl pt-4">{task.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-end">
                            <Button onClick={() => handleVerifyTask(taskName)} disabled={isDisabled}>
                                {isVerifying ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                                ) : isCompleted ? (
                                    <><CheckCircle2 className="mr-2 h-5 w-5" /> Completed</>
                                ) : (
                                    task.cta
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    </div>
);

const ActivateView = ({ handleActivateMining, isActivating }: Pick<DashboardContentProps, 'handleActivateMining' | 'isActivating'>) => (
    <div className="w-full text-center mt-8 flex flex-col items-center animate-in fade-in-50">
        <h2 className="text-4xl font-bold mb-4">All Tasks Completed!</h2>
        <p className="text-muted-foreground mb-12">You're ready to start mining. Click the button below to activate your account.</p>
        <Button onClick={handleActivateMining} size="lg" disabled={isActivating}>
            {isActivating ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Activating...</>
            ) : (
                <>
                <Play className="mr-2 h-5 w-5" />
                Activate Mining
                </>
            )}
        </Button>
    </div>
);

const DashboardView = ({
    minedPoints = 0, MINING_REWARD = 0, timeRemaining = 0, formatTime = () => '',
    totalPoints = 0, referralCode = '', handleCopy = () => {}, referralCount = 0,
    POINTS_PER_REFERRAL = 0
}: Omit<DashboardContentProps, 'onboardingStep' | 'tasksCompleted' | 'verifyingTask' | 'TASK_ICONS' | 'TASKS' | 'handleVerifyTask' | 'isActivating' | 'handleActivateMining'>) => (
    <main className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <Card className="md:col-span-3 bg-secondary/30 border-accent/30 shadow-lg shadow-accent/5">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
                    <Loader2 className="text-accent animate-spin" />
                    Mining Session
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2">
                        <p className="text-3xl font-bold text-primary">
                            {minedPoints.toFixed(4)} <span className="text-xl text-accent">PTS Mined</span>
                        </p>
                        <p className="text-lg text-muted-foreground">
                            Time Remaining: {formatTime(timeRemaining)}
                        </p>
                    </div>
                    <Progress value={(minedPoints / MINING_REWARD) * 100} className="w-full h-2" />
                    <p className="text-sm text-center text-muted-foreground">
                        You are mining {MINING_REWARD} PTS. Points will be added to your balance when the session ends.
                    </p>
                </div>
            </CardContent>
        </Card>

        <Card className="md:col-span-3 bg-secondary/30 border-accent/30 shadow-lg shadow-accent/5">
            <CardHeader>
            <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
                <Gift className="text-accent" />
                Your Points Balance
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
                Your Referral Code
            </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="flex items-center space-x-2 bg-background/50 p-3 rounded-lg border border-dashed border-border">
                <p className="text-xl tracking-widest font-mono text-accent flex-grow overflow-x-auto no-scrollbar">
                {referralCode}
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
                <p className="text-3xl font-bold">{referralCount}</p>
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
                {new Intl.NumberFormat().format(referralCount * POINTS_PER_REFERRAL)}
                </p>
            </CardContent>
            </Card>
        </div>
    </main>
);


export default function DashboardContent(props: DashboardContentProps) {
    const { onboardingStep } = props;

    return (
        <div className="w-full max-w-5xl mx-auto">
             {onboardingStep === 'tasks' && <TasksView {...props} />}
             {onboardingStep === 'activate' && <ActivateView {...props} />}
             {onboardingStep === 'dashboard' && <DashboardView {...props} />}
        </div>
    );
}
