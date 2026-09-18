import http from 'k6/http';
import { check } from 'k6';
import { Gauge, Trend, Counter } from 'k6/metrics';


// =====================================================
// CONFIG
// =====================================================

const BASE_URL = 'http://localhost:3000';


// =====================================================
// REQUEST METRICS
// =====================================================

const healthDuration = new Trend(
    'health_duration',
    true
);


// =====================================================
// SERVER METRICS
// =====================================================

// CPU
const cpuPercent = new Gauge(
    'node_cpu_percent'
);


// Memory
const rssMb = new Gauge(
    'node_rss_mb'
);

const heapUsedMb = new Gauge(
    'node_heap_used_mb'
);

const heapTotalMb = new Gauge(
    'node_heap_total_mb'
);


// =====================================================
// EVENT LOOP
// =====================================================

const eventLoopMeanMs = new Gauge(
    'event_loop_mean_ms'
);

const eventLoopP95Ms = new Gauge(
    'event_loop_p95_ms'
);

const eventLoopMaxMs = new Gauge(
    'event_loop_max_ms'
);


// =====================================================
// DATABASE
// =====================================================

const dbTotal = new Gauge(
    'db_total_connections'
);

const dbIdle = new Gauge(
    'db_idle_connections'
);

const dbWaiting = new Gauge(
    'db_waiting_connections'
);

const dbMax = new Gauge(
    'db_max_connections'
);


// =====================================================
// ERROR METRICS
// =====================================================

const healthErrors = new Counter(
    'health_errors'
);


// Event loop p95 > 50ms
const eventLoopSpikes = new Counter(
    'event_loop_spikes'
);


// =====================================================
// OPTIONS
// =====================================================

export const options = {

    scenarios: {

        load: {

            executor: 'constant-arrival-rate',

            // Her saniye gönderilecek request sayısı
            rate: 6000,

            // rate birimi
            timeUnit: '1s',

            // Test süresi
            duration: '30s',

            // Başlangıçta kaç VU kullanılacak
            preAllocatedVUs: 100,

            // Gerekirse k6'nın çıkarabileceği maksimum VU
            maxVUs: 3000,

        },


        // =================================================
        // SERVER METRICS
        // =================================================

        metrics: {

            executor: 'constant-vus',

            vus: 1,

            duration: '30s',

            exec: 'collectServerMetrics',

        },
    },


    // =================================================
    // THRESHOLDS
    // =================================================

    thresholds: {

        http_req_failed: [
            'rate<0.01',
        ],

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
// SERVER METRICS
// =====================================================

export function collectServerMetrics() {

    const response = http.get(
        `${BASE_URL}/metrics`
    );


    if (response.status !== 200) {
        return;
    }


    const metrics = response.json();


    // =================================================
    // CPU
    // =================================================

    cpuPercent.add(
        metrics.cpu.percent
    );


    // =================================================
    // MEMORY
    // =================================================

    rssMb.add(
        metrics.memory.rss / 1024 / 1024
    );

    heapUsedMb.add(
        metrics.memory.heapUsed / 1024 / 1024
    );

    heapTotalMb.add(
        metrics.memory.heapTotal / 1024 / 1024
    );


    // =================================================
    // EVENT LOOP
    // =================================================

    eventLoopMeanMs.add(
        metrics.eventLoop.meanMs
    );

    eventLoopP95Ms.add(
        metrics.eventLoop.p95Ms
    );

    eventLoopMaxMs.add(
        metrics.eventLoop.maxMs
    );


    // =================================================
    // EVENT LOOP SPIKE
    // =================================================

    if (metrics.eventLoop.p95Ms > 50) {

        eventLoopSpikes.add(1);

    }


    // =================================================
    // DATABASE
    // =================================================

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
// LOAD TEST
// =====================================================

export default function () {

    const response = http.get(
        `${BASE_URL}/health`,
        {
            tags: {
                endpoint: 'health',
            },
        }
    );


    // =================================================
    // RESPONSE TIME
    // =================================================

    healthDuration.add(
        response.timings.duration
    );


    // =================================================
    // CHECK
    // =================================================

    const successful = check(
        response,
        {
            'health request successful':
                (response) => response.status === 200,
        }
    );


    // =================================================
    // ERROR
    // =================================================

    if (!successful) {

        healthErrors.add(
            1,
            {
                status: String(response.status),
            }
        );

    }
}