import http from 'k6/http';
import { check, sleep } from 'k6';
import { Gauge, Trend, Counter } from 'k6/metrics';

const BASE_URL = 'http://localhost:3000';
const createUserDuration = new Trend(
    'create_user_duration',
    true
);

const createUserErrors = new Counter(
    'create_user_errors'
);

// CPU
const cpuPercent = new Gauge(
    'node_cpu_percent'
);
const rssMb = new Gauge(
    'node_rss_mb'
);

const heapUsedMb = new Gauge(
    'node_heap_used_mb'
);

const heapTotalMb = new Gauge(
    'node_heap_total_mb'
);

const eventLoopMeanMs = new Gauge(
    'event_loop_mean_ms'
);

const eventLoopP95Ms = new Gauge(
    'event_loop_p95_ms'
);

const eventLoopMaxMs = new Gauge(
    'event_loop_max_ms'
);

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


const eventLoopSpikes = new Counter(
    'event_loop_spikes'
);


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


    cpuPercent.add(
        metrics.cpu.percent
    );


    rssMb.add(
        metrics.memory.rss / 1024 / 1024
    );

    heapUsedMb.add(
        metrics.memory.heapUsed / 1024 / 1024
    );

    heapTotalMb.add(
        metrics.memory.heapTotal / 1024 / 1024
    );


    eventLoopMeanMs.add(
        metrics.eventLoop.meanMs
    );

    eventLoopP95Ms.add(
        metrics.eventLoop.p95Ms
    );

    eventLoopMaxMs.add(
        metrics.eventLoop.maxMs
    );



    if (metrics.eventLoop.p95Ms > 50) {

        eventLoopSpikes.add(1);
    }


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



    sleep(1);
}



export default function () {


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



    createUserDuration.add(
        response.timings.duration
    );


    const successful = check(

        response,

        {

            'create user successful':
                (response) =>
                    response.status === 201 ||
                    response.status === 200,

        }
    );

    if (!successful) {

        createUserErrors.add(

            1,

            {

                status:
                    String(response.status),

            }
        );
    }

    // Burada sleep() kullanmıyoruz.
    //
    // Amaç:
    // VU'nun mümkün olduğunca hızlı şekilde
    // POST /users göndererek database'e yük
    // oluşturmasıdır.

}