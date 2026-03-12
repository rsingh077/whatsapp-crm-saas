import { createMessageWorker } from './workers/message.worker';
import { createCampaignWorker } from './workers/campaign.worker';
import { createAutomationWorker } from './workers/automation.worker';

console.log('🚀 Starting Hotel CRM Worker Service...');
console.log(`📡 Redis: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);

// Initialize all workers
const messageWorker = createMessageWorker();
const campaignWorker = createCampaignWorker();
const automationWorker = createAutomationWorker();

console.log('✅ Workers started:');
console.log('  • Message Worker (concurrency: 5, rate-limited)');
console.log('  • Campaign Worker (concurrency: 2)');
console.log('  • Automation Worker (concurrency: 10)');

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down workers...');

  await Promise.all([
    messageWorker.close(),
    campaignWorker.close(),
    automationWorker.close(),
  ]);

  console.log('✅ All workers stopped');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
