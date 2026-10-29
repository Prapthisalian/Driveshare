import '../src/config.js';
import bcrypt from 'bcryptjs';
import { db } from '../src/db.js';
import { demo } from '../src/config.js';
import { policy } from '../src/policies.js';
import { now } from '../src/clock.js';
import { randomUUID } from 'node:crypto';

export async function seed() {
  if (!demo) throw new Error('Seeding requires DEMO_MODE=true and NODE_ENV other than production.');
  if (await db.user.findUnique({ where: { email: 'admin@driveshare.demo' } })) {
    console.log('Demo data already exists; seed skipped. Use db:reset for an explicit reset.');
    return;
  }
  const hash = await bcrypt.hash('DriveShareDemo!23', 12);
  await db.$transaction(
    async (tx) => {
      const people = [
        ['Aditi Rao', 'admin', 'ADMIN'],
        ['Meera Nair', 'owner', 'OWNER'],
        ['Arjun Shah', 'owner2', 'OWNER'],
        ['Riya Sharma', 'driver', 'DRIVER'],
        ['Kabir Patel', 'driver2', 'DRIVER'],
        ['Ananya Iyer', 'driver3', 'DRIVER'],
        ['Dev Mehta', 'driver4', 'DRIVER'],
      ];
      const users = [];
      for (const [fullName, name, role] of people)
        users.push(
          await tx.user.create({
            data: {
              fullName,
              email: `${name}@driveshare.demo`,
              passwordHash: hash,
              roles: role === 'OWNER' ? ['DRIVER', 'OWNER'] : [role],
              emailVerified: true,
            },
          }),
        );
      const vehicles = [];
      for (let i = 3; i < 7; i++)
        vehicles.push(
          await tx.vehicle.create({
            data: {
              userId: users[i].id,
              registrationNumber: `DEMO KA 0${i} AB ${1200 + i}`,
              vehicleType: i === 5 ? 'TWO_WHEELER' : 'CAR',
              vehicleModel: i === 5 ? 'Honda Activa (demo)' : 'Maruti Swift (demo)',
            },
          }),
        );
      const names = [
        'The Courtyard · Campus Gate',
        'Greenview Residence',
        'Library Lane Parking',
        'The Banyan House',
        'Maple Court · East Wing',
        'Garden Terrace',
        'Metro Corner',
        'The Quiet Driveway',
      ];
      const types = ['COVERED', 'GATED', 'OPEN', 'COVERED', 'GATED', 'OPEN', 'COVERED', 'OPEN'];
      const spots = [];
      for (let i = 0; i < 8; i++) {
        const spot = await tx.parkingSpot.create({
          data: {
            ownerId: users[(i % 2) + 1].id,
            title: names[i],
            description:
              'A thoughtfully maintained private parking space near the fictional DriveShare University campus. Easy access, a helpful host, and a quieter arrival. Demonstration listing; not a real parking offer.',
            address: `${14 + i * 7}, ${['University campus', 'Indiranagar', 'Koramangala', 'Jayanagar'][i % 4]} Road, Bengaluru (fictional demo)`,
            city: 'Bengaluru',
            latitude: 12.9346 + [0.001, 0.005, -0.004, 0.007, -0.007, 0.002, -0.003, 0.008][i],
            longitude: 77.6057 + [0.002, -0.004, 0.005, 0.008, -0.006, -0.008, 0.009, -0.002][i],
            hourlyPrice: [4000, 6000, 2500, 5000, 3500, 2000, 7500, 3000][i],
            vehicleTypes: i === 5 ? ['TWO_WHEELER'] : ['CAR', 'TWO_WHEELER'],
            parkingType: types[i],
            spotNumber: `P-${i + 1}`,
            accessInstructions:
              'Call the host at the gate. Park within the marked bay. Owner must verify entry and exit.',
            images: [`/demo/parking-${(i % 3) + 1}.svg`],
            approvalStatus: i === 7 ? 'PENDING' : 'APPROVED',
            permissionConfirmed: true,
            audit: [{ action: 'DEMO_SEEDED', at: now().toISOString() }],
          },
        });
        for (let day = 0; day < 7; day++)
          await tx.availabilitySlot.create({
            data: {
              parkingSpotId: spot.id,
              dayOfWeek: day,
              startTime: '00:00',
              endTime: '24:00',
              effectiveFrom: new Date('2020-01-01'),
              effectiveUntil: new Date('2099-12-31'),
            },
          });
        spots.push(spot);
      }
      const t = +now(),
        minute = 60000;
      async function booking(
        s: number,
        d: number,
        start: number,
        end: number,
        status: string,
        extra: Record<string, unknown> = {},
      ) {
        const amount = Math.ceil(((end - start) / 3600000) * spots[s].hourlyPrice);
        const b = await tx.booking.create({
          data: {
            driverId: users[d + 3].id,
            parkingSpotId: spots[s].id,
            vehicleId: vehicles[d].id,
            startTime: new Date(start),
            endTime: new Date(end),
            bookingStatus: status,
            paymentStatus: ['WAITLISTED', 'PAYMENT_PENDING'].includes(status)
              ? 'PENDING'
              : 'SUCCESS',
            totalAmount: amount,
            priceSnapshot: spots[s].hourlyPrice,
            termsSnapshot: {
              ...policy(),
              title: spots[s].title,
              address: spots[s].address,
              accessInstructions: spots[s].accessInstructions,
              timezone: 'Asia/Kolkata',
            },
            idempotencyKey: `seed:${randomUUID()}`,
            audit: [{ action: 'DEMO_SEEDED', at: now().toISOString() }],
            ...extra,
          },
        });
        if (b.paymentStatus === 'SUCCESS')
          await tx.payment.create({
            data: {
              bookingId: b.id,
              paymentType: 'BOOKING',
              amount,
              paymentMethod: 'DEMO_UPI',
              paymentStatus: 'SUCCESS',
              transactionReference: `DEMO-SEED-${randomUUID()}`,
              idempotencyKey: `seed-payment:${b.id}`,
            },
          });
        return b;
      }
      await booking(0, 0, t - 180 * minute, t - 35 * minute, 'CHECKED_IN', {
        occupied: true,
        checkedInAt: new Date(t - 175 * minute),
      });
      await booking(0, 3, t + 10 * minute, t + 70 * minute, 'CONFIRMED');
      const disputed = await booking(1, 1, t - 86400000, t - 86400000 + 3600000, 'COMPLETED', {
        checkedInAt: new Date(t - 86400000),
        actualExitTime: new Date(t - 86400000 + 95 * minute),
        exitConfirmedBy: users[2].id,
        overstayMinutes: 35,
        fineAmount: 4000,
        fineStatus: 'DISPUTED',
        dispute: {
          status: 'OPEN',
          message:
            'The host was delayed confirming my departure. Please review this demonstration fine.',
          openedAt: now().toISOString(),
          responses: [],
        },
      });
      await booking(2, 1, t + 120 * minute, t + 240 * minute, 'CONFIRMED');
      await booking(2, 2, t + 120 * minute, t + 240 * minute, 'WAITLISTED');
      const completed = await booking(3, 0, t - 172800000, t - 172800000 + 3600000, 'COMPLETED', {
        actualExitTime: new Date(t - 172800000 + 3600000),
        checkedInAt: new Date(t - 172800000),
        exitConfirmedBy: users[2].id,
      });
      await tx.review.create({
        data: {
          bookingId: completed.id,
          reviewerId: completed.driverId,
          parkingSpotId: completed.parkingSpotId,
          rating: 5,
          comment: 'Easy to find, a welcoming host, and plenty of room. Fictional demo review.',
        },
      });
      await tx.review.create({
        data: {
          bookingId: disputed.id,
          reviewerId: disputed.driverId,
          parkingSpotId: disputed.parkingSpotId,
          rating: 4,
          comment: 'A convenient space near campus. Fictional demo review.',
        },
      });
      const cancelled = await booking(4, 2, t - 7200000, t - 3600000, 'CANCELLED', {
        cancelledAt: new Date(t - 86400000),
        cancellationReason: 'Plans changed (demo)',
        paymentStatus: 'SUCCESS',
      });
      await tx.payment.create({
        data: {
          bookingId: cancelled.id,
          paymentType: 'REFUND',
          amount: -cancelled.totalAmount,
          paymentMethod: 'DEMO_SYSTEM',
          paymentStatus: 'SUCCESS',
          transactionReference: `DEMO-SEED-${randomUUID()}`,
          idempotencyKey: `refund:${cancelled.id}`,
        },
      });
      await tx.booking.update({ where: { id: cancelled.id }, data: { paymentStatus: 'REFUNDED' } });
    },
    { timeout: 30000 },
  );
  console.log(
    'Created fictional demo accounts, 8 spaces, schedules, sessions, waitlist, reviews and signed payment entries.',
  );
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/prisma/seed.ts'))
  seed().finally(() => db.$disconnect());
