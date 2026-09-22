import http from 'k6/http';
import { check, sleep } from 'k6';
import { Gauge, Trend, Counter } from 'k6/metrics';


// =====================================================
// CONFIG
// =====================================================

const BASE_URL = 'http://localhost:3000';


// =====================================================
// REQUEST METRICS
// =====================================================

const createUserDuration = new Trend(
    'create_user_duration',
    true
);

const createUserErrors = new Counter(
    'create_user_errors'
);


// =====================================================
// SERVER METRICS
// =====================================================

// CPU
const cpuPercent = new Gauge(
    'node_cpu_percent'
);


// =====================================================
// MEMORY
// =====================================================

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
// EVENT LOOP SPIKES
// =====================================================

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

            rate: 1500,

            timeUnit: '1s',

            duration: '60s',

            preAllocatedVUs: 1000,

            maxVUs: 4000,
        },


      

        metrics: {

            executor: 'constant-vus',

            vus: 1,

            duration: '60s',

            exec: 'collectServerMetrics',
        },
    },


    // =====================================================
    // THRESHOLDS
    // =====================================================

    thresholds: {

        // Request error rate
        http_req_failed: [
            'rate<0.01',
        ],

        // 95% of requests should normally be below 500ms
        http_req_duration: [
            'p(95)<500',
            'p(99)<1000',
        ],
    },


    // =====================================================
    // SUMMARY
    // =====================================================

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


    // Metrics endpoint başarısızsa
    if (response.status !== 200) {

        sleep(1);

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


    // =================================================
    // METRICS INTERVAL
    // =================================================

    sleep(1);
}


// =====================================================
// LOAD TEST
// =====================================================

export default function () {


    // =================================================
    // CREATE USER
    // =================================================

    const uniqueId =
        `${__VU}-${__ITER}-${Date.now()}`;


    const payload = JSON.stringify({

        name:
            `LoadTest-${uniqueId}`,

        email:
            `loadtest-${uniqueId}@test.com`,

        password:
            'test123',

    });


    const response = http.post(

        `${BASE_URL}/users`,

        payload,

        {

            headers: {

                'Content-Type':
                    'application/json',

            },

            tags: {

                endpoint:
                    'create-user',

            },
        }
    );


    // =================================================
    // RESPONSE TIME
    // =================================================

    createUserDuration.add(
        response.timings.duration
    );


    // =================================================
    // CHECK
    // =================================================

    const successful = check(

        response,

        {

            'create user successful':
                (response) =>
                    response.status === 201 ||
                    response.status === 200,

        }
    );


    // =================================================
    // ERROR
    // =================================================

    if (!successful) {

        createUserErrors.add(

            1,

            {

                status:
                    String(response.status),

            }
        );
    }


    // =================================================
    // IMPORTANT
    // =================================================

    // Burada sleep() kullanmıyoruz.
    //
    // Amaç:
    // VU'nun mümkün olduğunca hızlı şekilde
    // POST /users göndererek database'e yük
    // oluşturmasıdır.

}