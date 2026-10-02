import http from 'k6/http';
import { check, sleep } from 'k6';
import { Gauge, Trend} from 'k6/metrics';
const loginDuration = new Trend('login_duration', true);
const usersDuration = new Trend('users_duration', true);
const userDetailDuration = new Trend('user_detail_duration', true);

const cpuPercent = new Gauge('node_cpu_percent');

const rssMb = new Gauge('node_rss_mb');
const heapUsedMb = new Gauge('node_heap_used_mb');
const heapTotalMb = new Gauge('node_heap_total_mb');

const eventLoopMeanMs = new Gauge('event_loop_mean_ms');
const eventLoopP95Ms = new Gauge('event_loop_p95_ms');
const eventLoopMaxMs = new Gauge('event_loop_max_ms');

const dbTotal = new Gauge('db_total_connections');
const dbIdle = new Gauge('db_idle_connections');
const dbWaiting = new Gauge('db_waiting_connections');
const dbMax = new Gauge('db_max_connections');


export const options = {

    scenarios: {

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

        metrics: {
            executor: 'constant-vus',

            vus: 1,

            duration: '7m',

            exec: 'collectServerMetrics',
        },
    },

    thresholds: {
        http_req_failed: ['rate<0.01'],

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
        'http://localhost:3000/metrics'
    );

    if (response.status !== 200) {
        return;
    }

    const metrics = response.json();

    cpuPercent.add(metrics.cpu.percent);

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


export default function () {

    // 1. Login

    const loginResponse = http.post(
        'http://localhost:3000/auth/login',

        JSON.stringify({
            email: 'test@example.com',
            password: 'test123',
        }),

        {
            headers: {
                'Content-Type': 'application/json',
            },
            tags: {
                endpoint: 'login',
            }
        }
    );
    loginDuration.add(loginResponse.timings.duration);


    check(loginResponse, {
        'login successful':
            (response) => response.status === 201,
    });




    // 2. User list

    const usersResponse = http.get(
        'http://localhost:3000/users',
        {
            tags: {
                endpoint: 'users',
            },
        }
    );
    usersDuration.add(usersResponse.timings.duration);

    check(usersResponse, {
        'users request successful':
            (response) => response.status === 200,
    });





    // 3. User detail

    const userResponse = http.get(
        'http://localhost:3000/users/1',
        {
            tags: {
                endpoint: 'user-detail',
            }
        }
    );
    userDetailDuration.add(userResponse.timings.duration);
    

    check(userResponse, {
        'user detail successful':
            (response) => response.status === 200,
    });



}