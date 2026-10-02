import http from 'k6/http';
import { check, sleep } from 'k6';


export const options = {

  scenarios: {

    load: {
      executor: 'ramping-vus',

      startVUs: 0,

      stages: [
        { duration: '20s', target: 100 },
        { duration: '20s', target: 200 },
        { duration: '20s', target: 300 },
        { duration: '20s', target: 0 },
      ],

      gracefulRampDown: '5s',
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


export default function () {

  // Login

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
    }
  );

  check(loginResponse, {
    'login successful':
      (response) => response.status === 201,
  });


  sleep(1);


  // User list

  const usersResponse = http.get(
    'http://localhost:3000/users'
  );

  check(usersResponse, {
    'users request successful':
      (response) => response.status === 200,
  });


  sleep(1);


  // User detail

  const userResponse = http.get(
    'http://localhost:3000/users/1'
  );

  check(userResponse, {
    'user detail successful':
      (response) => response.status === 200,
  });


  sleep(1);
}