import http from 'k6/http';
import { check } from 'k6';
import { Gauge, Trend, Counter } from 'k6/metrics';


// =====================================================
// CONFIG
// =====================================================

const BASE_URL = 'http://localhost:3000';


// =====================================================
// REQUEST DURATION METRICS
// =====================================================

const healthDuration = new Trend('health_duration', true);


// =====================================================
// SERVER METRICS
// =====================================================

// CPU
const cpuPercent = new Gauge('node_cpu_percent');

// Memory
const rssMb = new Gauge('node_rss_mb');
const heapUsedMb = new Gauge('node_heap_used_mb');
const heapTotalMb = new Gauge('node_heap_total_mb');

// Event Loop
const eventLoopMeanMs = new Gauge('event_loop_mean_ms');
const eventLoopP95Ms = new Gauge('event_loop_p95_ms');
const eventLoopMaxMs = new Gauge('event_loop_max_ms');

// Database Pool
const dbTotal = new Gauge('db_total_connections');
const dbIdle = new Gauge('db_idle_connections');
const dbWaiting = new Gauge('db_waiting_connections');
const dbMax = new Gauge('db_max_connections');


// =====================================================
// ERROR METRICS
// =====================================================

const healthErrors = new Counter('health_errors');


// =====================================================
// K6 OPTIONS
// =====================================================

export const options = {

    scenarios: {

        // ---------------------------------------------
        // Main load test
        // ---------------------------------------------

        load: {
            executor: 'ramping-vus',

            startVUs: 0,

            stages: [
                { duration: '30s', target: 100 },
                { duration: '30s', target: 200 },
                { duration: '30s', target: 300 },
                { duration: '30s', target: 400 },
                { duration: '30s', target: 500 },
                { duration: '30s', target: 600 },

                { duration: '30s', target: 700 },
                { duration: '60s', target: 700 },

                { duration: '30s', target: 800 },
                { duration: '30s', target: 900 },
                { duration: '60s', target: 1000 },

                { duration: '30s', target: 0 },
            ],

            gracefulRampDown: '5s',
        },


        // ---------------------------------------------
        // Server metric collection
        // ---------------------------------------------

        metrics: {
            executor: 'constant-vus',

            vus: 1,

            duration: '7m',

            exec: 'collectServerMetrics',
        },
    },


    // =================================================
    // THRESHOLDS
    // =================================================

    thresholds: {

        // Less than 1% HTTP errors
        http_req_failed: [
            'rate<0.01',
        ],

        // Response time
        http_req_duration: [
            'p(95)<500',
            'p(99)<1000',
        ],
    },


    // =================================================
    // SUMMARY
    // =================================================

    summaryTrendStats: [
        'avg',
        'min',
        'med',
        'p(90)',
        'p(95)',
        'p(99)',
        'max',
    ],
};


// =====================================================
// SERVER METRICS COLLECTION
// =====================================================

export function collectServerMetrics() {

    const response = http.get(
        `${BASE_URL}/metrics`
    );


    // If /metrics itself fails,
    // do not try to read the response.
    if (response.status !== 200) {
        return;
    }


    const metrics = response.json();


    // ---------------------------------------------
    // CPU
    // ---------------------------------------------

    cpuPercent.add(
        metrics.cpu.percent
    );


    // ---------------------------------------------
    // MEMORY
    // ---------------------------------------------

    rssMb.add(
        metrics.memory.rss / 1024 / 1024
    );

    heapUsedMb.add(
        metrics.memory.heapUsed / 1024 / 1024
    );

    heapTotalMb.add(
        metrics.memory.heapTotal / 1024 / 1024
    );


    // ---------------------------------------------
    // EVENT LOOP
    // ---------------------------------------------

    eventLoopMeanMs.add(
        metrics.eventLoop.meanMs
    );

    eventLoopP95Ms.add(
        metrics.eventLoop.p95Ms
    );

    eventLoopMaxMs.add(
        metrics.eventLoop.maxMs
    );


    // ---------------------------------------------
    // DATABASE POOL
    // ---------------------------------------------

    dbTotal.add(
        metrics.database.totalCount
    );

    dbIdle.add(
        metrics.database.idleCount
    );

    dbWaiting.add(
        metrics.database.waitingCount
    );

    dbMax.add(
        metrics.database.max
    );
}


// =====================================================
// MAIN LOAD TEST
// =====================================================



export default function () {

    const healthResponse = http.get(
        `${BASE_URL}/health`,
        {
            tags: {
                endpoint: 'health',
            },
        }
    );


    healthDuration.add(
        healthResponse.timings.duration
    );


    const healthSuccessful = check(
        healthResponse,
        {
            'health request successful':
                (response) => response.status === 200,
        }
    );


    if (!healthSuccessful) {
        healthErrors.add(1);
    }
}
