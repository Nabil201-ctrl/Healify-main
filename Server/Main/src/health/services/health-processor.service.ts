import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HealthLog, HealthLogDocument } from '../entities/health-log.entity';
import { Insight, InsightDocument } from '../entities/insight.entity';
import { CacheService } from '../../services/cache.service';

@Injectable()
export class HealthProcessorService {
    private readonly logger = new Logger(HealthProcessorService.name);

    constructor(
        @InjectModel(HealthLog.name)
        private healthLogModel: Model<HealthLogDocument>,
        @InjectModel(Insight.name)
        private insightModel: Model<InsightDocument>,
        private readonly cacheService: CacheService,
    ) { }

    // ─── Cached fetcher helper ─────────────────────────────────────────────────

    private async getCachedData<T>(
        key: string,
        fetcher: () => Promise<T>,
    ): Promise<T> {
        try {
            const cached = await this.cacheService.get<T>(key);
            if (cached) {
                this.logger.debug(`Cache HIT: ${key}`);
                return cached;
            }
        } catch (err) {
            this.logger.error(`Cache GET error for ${key}:`, err);
        }

        const data = await fetcher();

        try {
            if (data) {
                await this.cacheService.set(key, data, 300); // 5 min TTL
            }
        } catch (err) {
            this.logger.error(`Cache SET error for ${key}:`, err);
        }
        return data;
    }

    // ─── Data Builders ──────────────────────────────────────────────────────────

    async buildActivityData(userId: string): Promise<any> {
        const logs = await this.getCachedData(
            `health:logs:activity:7:${userId}`,
            async () =>
                this.healthLogModel
                    .find({ userId })
                    .sort({ date: -1 })
                    .limit(7)
                    .lean(),
        );

        const ordered = [...(logs as any[])].reverse();
        const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const labels = ordered.length
            ? ordered.map((l: any) => {
                const d = new Date(l.date);
                return DAY_LABELS[d.getDay()] || l.date;
            })
            : DAY_LABELS;

        const stepValues = ordered.map((l: any) => l.steps || 0);
        const dailyAvg = stepValues.length
            ? Math.round(
                stepValues.reduce((a: number, b: number) => a + b, 0) /
                stepValues.length,
            )
            : 0;
        const weeklyTotal = stepValues.reduce(
            (a: number, b: number) => a + b,
            0,
        );

        return {
            labels: labels.length === 7 ? labels : DAY_LABELS,
            datasets: [
                {
                    data:
                        stepValues.length === 7 ? stepValues : new Array(7).fill(0),
                },
            ],
            summary: { dailyAvg, weeklyTotal, goal: 10000 },
        };
    }

    async buildHeartRateData(userId: string): Promise<any> {
        const logs = await this.getCachedData(
            `health:logs:heartRate:7:${userId}`,
            async () =>
                this.healthLogModel
                    .find({ userId })
                    .sort({ date: -1 })
                    .limit(7)
                    .lean(),
        );

        const ordered = [...(logs as any[])].reverse();
        const TIME_LABELS = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];
        const hrValues = ordered
            .map((l: any) => l.heartRate || 0)
            .filter((v: number) => v > 0);

        const avg = hrValues.length
            ? Math.round(
                hrValues.reduce((a: number, b: number) => a + b, 0) /
                hrValues.length,
            )
            : 0;
        const min = hrValues.length ? Math.min(...hrValues) : 0;
        const max = hrValues.length ? Math.max(...hrValues) : 0;

        const chartData =
            hrValues.length >= 6
                ? hrValues.slice(0, 6)
                : new Array(6).fill(avg || 0);

        return {
            labels: TIME_LABELS,
            datasets: [{ data: chartData }],
            stats: { min, avg, max, resting: min || avg },
        };
    }

    async buildSleepData(userId: string): Promise<any> {
        const logs = await this.getCachedData(
            `health:logs:sleep:7:${userId}`,
            async () =>
                this.healthLogModel
                    .find({ userId })
                    .sort({ date: -1 })
                    .limit(7)
                    .lean(),
        );

        const ordered = [...(logs as any[])].reverse();
        const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const labels = ordered.length
            ? ordered.map((l: any) => {
                const d = new Date(l.date);
                return DAY_LABELS[d.getDay()] || l.date;
            })
            : DAY_LABELS;

        const data = ordered.map((l: any) => {
            const total = l.sleep || 0;
            const deep = parseFloat((total * 0.7).toFixed(1));
            const light = parseFloat((total * 0.2).toFixed(1));
            const rem = parseFloat((total * 0.1).toFixed(1));
            return [deep, light, rem];
        });

        const lastLog = ordered[ordered.length - 1] as any;
        const lastSleep = lastLog?.sleep || 0;
        const hrs = Math.floor(lastSleep);
        const mins = Math.round((lastSleep - hrs) * 60);

        return {
            labels: labels.length === 7 ? labels : DAY_LABELS,
            data: data.length === 7 ? data : new Array(7).fill([0, 0, 0]),
            lastNight: {
                duration: lastSleep > 0 ? `${hrs}h ${mins}m` : 'No data',
                quality:
                    lastSleep >= 7
                        ? 'Good'
                        : lastSleep >= 5
                            ? 'Fair'
                            : lastSleep > 0
                                ? 'Poor'
                                : 'No data',
                bedtime: '11:00 PM',
            },
        };
    }

    async buildQuickStats(userId: string): Promise<any> {
        const latest = await this.getCachedData(
            `health:logs:quickStats:${userId}`,
            async () =>
                this.healthLogModel
                    .findOne({ userId })
                    .sort({ date: -1 })
                    .lean(),
        );

        const steps = (latest as any)?.steps || 0;
        const distanceKm =
            steps > 0 ? parseFloat((steps * 0.0008).toFixed(1)) : 0;
        const activeTimeHrs =
            steps > 0 ? parseFloat((steps / 3000).toFixed(1)) : 0;

        return {
            distance: distanceKm > 0 ? `${distanceKm} km` : '0 km',
            activeTime: activeTimeHrs > 0 ? `${activeTimeHrs} h` : '0 h',
            floors: '0',
            stress: 'Normal',
            recovery: '90%',
        };
    }

    async buildInsights(userId: string): Promise<any[]> {
        const insights = await this.getCachedData(
            `health:logs:insights:5:${userId}`,
            async () =>
                this.insightModel
                    .find({ userId })
                    .sort({ timestamp: -1 })
                    .limit(5)
                    .lean(),
        );

        if (!(insights as any[]).length) return [];

        return (insights as any[]).map((i: any) => ({
            label: i.type.replace(/_/g, ' '),
            text: i.message,
            type:
                i.severity === 'WARNING' || i.severity === 'CRITICAL'
                    ? 'warning'
                    : 'info',
        }));
    }

    // ─── Health Context for AI ──────────────────────────────────────────────────

    async getHealthContext(userId: string): Promise<any | null> {
        const today = new Date().toISOString().split('T')[0];
        const log = await this.healthLogModel
            .findOne({ userId, date: today })
            .lean();
        const insights = await this.insightModel
            .find({ userId })
            .sort({ timestamp: -1 })
            .limit(3)
            .lean();

        if (!log && insights.length === 0) return null;

        return {
            current: log
                ? { heartRate: (log as any).heartRate, steps: (log as any).steps }
                : {},
            insights: insights.map((i: any) => i.message),
        };
    }

    // ─── Analyze & Store Health Data ────────────────────────────────────────────

    async analyzeAndStore(data: {
        userId?: string;
        heartRate?: number;
        steps?: number;
        sleep?: number;
    }): Promise<{ log: any; insights: string[] }> {
        const today = new Date().toISOString().split('T')[0];
        const userId = data.userId || 'default_user';

        let log = await this.healthLogModel.findOne({ userId, date: today });
        if (!log) {
            log = new this.healthLogModel({ userId, date: today });
        }
        if (data.heartRate) log.heartRate = data.heartRate;
        if (data.steps) log.steps = data.steps;
        if (data.sleep) log.sleep = data.sleep;
        await log.save();

        // Analyze against history
        const history = await this.healthLogModel
            .find({ userId })
            .sort({ date: -1 })
            .limit(5);
        const insights: string[] = [];

        if (history.length > 1) {
            const yesterday = history.find((h) => h.date !== today);
            if (yesterday) {
                if (
                    data.heartRate &&
                    yesterday.heartRate &&
                    data.heartRate > yesterday.heartRate + 10
                ) {
                    const msg = `Heart rate is significantly higher than yesterday (${yesterday.heartRate} bpm).`;
                    insights.push(msg);
                    await this.insightModel.create({
                        userId,
                        date: today,
                        type: 'HEART_RATE_TREND',
                        message: msg,
                        severity: 'WARNING',
                    });
                }
                if (
                    data.steps &&
                    yesterday.steps &&
                    data.steps < yesterday.steps / 2
                ) {
                    const msg = `Activity level is much lower than yesterday.`;
                    insights.push(msg);
                    await this.insightModel.create({
                        userId,
                        date: today,
                        type: 'ACTIVITY_DROP',
                        message: msg,
                        severity: 'INFO',
                    });
                }
            }
        }

        // Invalidate caches
        await this.invalidateCaches(userId);

        return { log, insights };
    }

    // ─── Google Fit sync processing ─────────────────────────────────────────────

    async processGoogleFitSync(
        userId: string,
        accessToken: string,
    ): Promise<void> {
        try {
            const fitData = await this.fetchGoogleFitData(accessToken);
            await this.analyzeAndStore({
                userId,
                steps: fitData.steps,
                heartRate: fitData.heartRate,
            });
        } catch (err) {
            this.logger.error('Google Fit Sync Error:', err);
            throw err;
        }
    }

    private async fetchGoogleFitData(
        accessToken: string,
    ): Promise<{ steps: number; heartRate: number }> {
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const body = {
            aggregateBy: [
                { dataTypeName: 'com.google.step_count.delta' },
                { dataTypeName: 'com.google.heart_rate.bpm' },
            ],
            bucketByTime: { durationMillis: 86400000 },
            startTimeMillis: start.getTime(),
            endTimeMillis: end.getTime(),
        };

        const response = await fetch(
            'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Google Fit API Error: ${response.status} - ${errorText}`,
            );
        }

        const data = await response.json();
        return this.parseGoogleFitData(data);
    }

    private parseGoogleFitData(data: any): {
        steps: number;
        heartRate: number;
    } {
        let steps = 0;
        const heartRates: number[] = [];

        if (!data.bucket || data.bucket.length === 0)
            return { steps, heartRate: 0 };

        data.bucket.forEach((bucket: any) => {
            bucket.dataset.forEach((dataset: any) => {
                dataset.point.forEach((point: any) => {
                    if (dataset.dataSourceId.includes('step_count')) {
                        point.value.forEach((val: any) => {
                            steps += val.intVal || 0;
                        });
                    }
                    if (dataset.dataSourceId.includes('heart_rate')) {
                        point.value.forEach((val: any) => {
                            if (val.fpVal) heartRates.push(val.fpVal);
                        });
                    }
                });
            });
        });

        const avgHeartRate =
            heartRates.length > 0
                ? Math.round(
                    heartRates.reduce((a, b) => a + b, 0) / heartRates.length,
                )
                : 0;

        return { steps, heartRate: avgHeartRate };
    }

    // ─── Cache Invalidation ─────────────────────────────────────────────────────

    private async invalidateCaches(userId: string): Promise<void> {
        const keys = [
            `health:logs:activity:7:${userId}`,
            `health:logs:heartRate:7:${userId}`,
            `health:logs:sleep:7:${userId}`,
            `health:logs:quickStats:${userId}`,
            `health:logs:insights:5:${userId}`,
        ];
        await Promise.all(keys.map((key) => this.cacheService.delete(key)));
        this.logger.log(`Invalidated caches for ${userId}`);
    }
}
