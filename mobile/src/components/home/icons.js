import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg/src/index';

const tags = { path: Path, circle: Circle, line: Line, rect: Rect };

function makeIcon(nodes) {
    return function Icon({ size = 24, color = '#000', strokeWidth = 2, fill = 'none' }) {
        return (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
                {nodes.map(([tag, props], index) => {
                    const Shape = tags[tag];
                    const next = { ...props };
                    delete next.key;
                    if (fill !== 'none') next.fill = fill;
                    return <Shape key={index} {...next} />;
                })}
            </Svg>
        );
    };
}

export const BadgeCheck = makeIcon([
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
        key: "3c2336"
      }
    ],
    ["path", { d: "m16 9-5.5 5.5L8 12", key: "xofnsj" }]
  ]);

export const Calendar = makeIcon([
    ["path", { d: "M8 2v3", key: "1ioesn" }],
    ["path", { d: "M16 2v3", key: "otl347" }],
    ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", key: "h1oib" }],
    ["path", { d: "M3 9h18", key: "1pudct" }]
  ]);

export const Car = makeIcon([
    [
      "path",
      {
        d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
        key: "5owen"
      }
    ],
    ["circle", { cx: "7", cy: "17", r: "2", key: "u2ysq9" }],
    ["path", { d: "M9 17h6", key: "r8uit2" }],
    ["circle", { cx: "17", cy: "17", r: "2", key: "axvx0g" }]
  ]);

export const CarTaxiFront = makeIcon([
    ["path", { d: "M10 2h4", key: "n1abiw" }],
    [
      "path",
      {
        d: "m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8",
        key: "1imjwt"
      }
    ],
    ["path", { d: "M7 14h.01", key: "1qa3f1" }],
    ["path", { d: "M17 14h.01", key: "7oqj8z" }],
    ["rect", { width: "18", height: "8", x: "3", y: "10", rx: "2", key: "a7itu8" }],
    ["path", { d: "M5 18v2", key: "ppbyun" }],
    ["path", { d: "M19 18v2", key: "gy7782" }]
  ]);

export const Cherry = makeIcon([
    ["path", { d: "M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z", key: "cvxqlc" }],
    ["path", { d: "M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z", key: "1ostrc" }],
    ["path", { d: "M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12", key: "hqx58h" }],
    ["path", { d: "M22 9c-4.29 0-7.14-2.33-10-7 5.71 0 10 4.67 10 7Z", key: "eykp1o" }]
  ]);

export const Clock = makeIcon([
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "M12 6v6l4 2", key: "mmk7yg" }]
  ]);

export const Cookie = makeIcon([
    ["path", { d: "M11 17h.01", key: "dukryu" }],
    [
      "path",
      {
        d: "M11.496 2c.324-.016.558.292.529.615a4 4 0 004.235 4.368.713.713 0 01.758.757 4 4 0 004.366 4.237c.323-.03.63.204.614.527a10 10 0 01-2.915 6.566A1 1 0 114.93 4.918 10 10 0 0111.496 2",
        key: "1x76et"
      }
    ],
    ["path", { d: "M12 12h.01", key: "1mp3jc" }],
    ["path", { d: "M16 16h.01", key: "1f9h7w" }],
    ["path", { d: "M16 3h.01", key: "ll0zb8" }],
    ["path", { d: "M21 4h.01", key: "uw58yv" }],
    ["path", { d: "M21 8h.01", key: "17axm7" }],
    ["path", { d: "M7 14h.01", key: "1qa3f1" }],
    ["path", { d: "M9 8h.01", key: "1jwowd" }]
  ]);

export const CreditCard = makeIcon([
    ["rect", { width: "20", height: "14", x: "2", y: "5", rx: "2", key: "ynyp8z" }],
    ["line", { x1: "2", x2: "22", y1: "10", y2: "10", key: "1b3vmo" }],
    ["path", { d: "M6 14h2", key: "mk7k0u" }]
  ]);

export const Heart = makeIcon([
    ["path", { d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z", key: "c3ymky" }]
]);

export const Check = makeIcon([
    ["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]
]);

export const Gift = makeIcon([
    ["path", { d: "M12 7v14", key: "1akyts" }],
    ["path", { d: "M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8", key: "1sqzm4" }],
    [
      "path",
      { d: "M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5", key: "kc0143" }
    ],
    ["rect", { x: "3", y: "7", width: "18", height: "4", rx: "1", key: "1hberx" }]
  ]);

export const Headphones = makeIcon([
    [
      "path",
      {
        d: "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3",
        key: "1xhozi"
      }
    ]
  ]);

export const Hotel = makeIcon([
    ["path", { d: "M10 22v-6.57", key: "1wmca3" }],
    ["path", { d: "M12 11h.01", key: "z322tv" }],
    ["path", { d: "M12 7h.01", key: "1ivr5q" }],
    ["path", { d: "M14 15.43V22", key: "1q2vjd" }],
    ["path", { d: "M15 16a5 5 0 0 0-6 0", key: "o9wqvi" }],
    ["path", { d: "M16 11h.01", key: "xkw8gn" }],
    ["path", { d: "M16 7h.01", key: "1kdx03" }],
    ["path", { d: "M8 11h.01", key: "1dfujw" }],
    ["path", { d: "M8 7h.01", key: "1vti4s" }],
    ["rect", { x: "4", y: "2", width: "16", height: "20", rx: "2", key: "1uxh74" }]
  ]);

export const Home = makeIcon([
    ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", key: "5wwlr5" }],
    [
      "path",
      {
        d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
        key: "r6nss1"
      }
    ]
  ]);

export const Languages = makeIcon([
    ["path", { d: "m5 8 6 6", key: "1wu5hv" }],
    ["path", { d: "m4 14 6-6 2-3", key: "1k1g8d" }],
    ["path", { d: "M2 5h12", key: "or177f" }],
    ["path", { d: "M7 2h1", key: "1t2jsx" }],
    ["path", { d: "m22 22-5-10-5 10", key: "don7ne" }],
    ["path", { d: "M14 18h6", key: "1m8k6r" }]
  ]);

export const MapPin = makeIcon([
    [
      "path",
      {
        d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
        key: "1r0f0z"
      }
    ],
    ["circle", { cx: "12", cy: "10", r: "3", key: "ilqhr7" }]
  ]);

export const Menu = makeIcon([
    ["path", { d: "M4 5h16", key: "1tepv9" }],
    ["path", { d: "M4 12h16", key: "1lakjw" }],
    ["path", { d: "M4 19h16", key: "1djgab" }]
  ]);

export const Phone = makeIcon([
    [
      "path",
      {
        d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
        key: "9njp5v"
      }
    ]
  ]);

export const Search = makeIcon([
    ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
    ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
  ]);

export const Shield = makeIcon([
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        key: "oel41y"
      }
    ]
  ]);

export const ShieldCheck = makeIcon([
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        key: "oel41y"
      }
    ],
    ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
  ]);

export const Star = makeIcon([
    [
      "path",
      {
        d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
        key: "r04s7s"
      }
    ]
  ]);

export const Tent = makeIcon([
    ["path", { d: "M3.5 21 14 3", key: "1szst5" }],
    ["path", { d: "M20.5 21 10 3", key: "1310c3" }],
    ["path", { d: "M15.5 21 12 15l-3.5 6", key: "1ddtfw" }],
    ["path", { d: "M2 21h20", key: "1nyx9w" }]
  ]);

export const Trees = makeIcon([
    [
      "path",
      { d: "M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z", key: "1l6gj6" }
    ],
    ["path", { d: "M7 16v6", key: "1a82de" }],
    ["path", { d: "M13 19v3", key: "13sx9i" }],
    [
      "path",
      {
        d: "M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5",
        key: "1sj9kv"
      }
    ]
  ]);

export const LayoutDashboard = makeIcon([
    ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "5", x: "14", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "9", x: "14", y: "12", rx: "1" }],
    ["rect", { width: "7", height: "5", x: "3", y: "16", rx: "1" }]
]);

export const Building2 = makeIcon([
    ["path", { d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" }],
    ["path", { d: "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" }],
    ["path", { d: "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M10 6h4" }],
    ["path", { d: "M10 10h4" }],
    ["path", { d: "M10 14h4" }],
    ["path", { d: "M10 18h4" }]
]);

export const Tag = makeIcon([
    ["path", { d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" }],
    ["circle", { cx: "7.5", cy: "7.5", r: "1.5" }]
]);

export const CalendarDays = makeIcon([
    ["path", { d: "M8 2v4" }],
    ["path", { d: "M16 2v4" }],
    ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }],
    ["path", { d: "M3 10h18" }],
    ["path", { d: "M8 14h.01" }],
    ["path", { d: "M12 14h.01" }],
    ["path", { d: "M16 14h.01" }],
    ["path", { d: "M8 18h.01" }],
    ["path", { d: "M12 18h.01" }],
    ["path", { d: "M16 18h.01" }]
]);

export const Megaphone = makeIcon([
    ["path", { d: "m3 11 18-5v12L3 14v-3z" }],
    ["path", { d: "M11.6 16.8a3 3 0 1 1-5.8-1.6" }]
]);

export const FileText = makeIcon([
    ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
    ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
    ["path", { d: "M10 9H8" }],
    ["path", { d: "M16 13H8" }],
    ["path", { d: "M16 17H8" }]
]);

export const ShoppingBag = makeIcon([
    ["path", { d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" }],
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M16 10a4 4 0 0 1-8 0" }]
]);

export const Wallet = makeIcon([
    ["path", { d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" }],
    ["path", { d: "M3 5v14a2 2 0 0 0 2 2h15v-7" }]
]);

export const User = makeIcon([
    ["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
    ["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }]
]);

export const Users = makeIcon([
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
    ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744", key: "16gr8j" }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
    ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }]
  ]);

export const X = makeIcon([
    ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
    ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
  ]);

export const Eye = makeIcon([
    ["path", { d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" }],
    ["circle", { cx: "12", cy: "12", r: "3" }],
]);

export const EyeOff = makeIcon([
    ["path", { d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" }],
    ["path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242" }],
    ["path", { d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" }],
    ["path", { d: "m2 2 20 20" }],
]);
