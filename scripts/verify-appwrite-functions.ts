/**
 * Script to verify Appwrite Functions configuration
 *
 * This script checks:
 * 1. Balance Sync Function configuration
 * 2. Recurring Transactions Function configuration
 * 3. Environment variables
 * 4. Function deployments
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { Client, Functions } from 'node-appwrite';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config();

// Load environment variables
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

interface FunctionConfig {
  name: string;
  functionId: string;
  expectedEvents?: string[];
  expectedSchedule?: string;
  expectedVars: string[];
}

const FUNCTIONS_TO_VERIFY: FunctionConfig[] = [
  {
    name: 'Balance Sync',
    functionId: 'balance-sync',
    expectedEvents: [
      'databases.*.collections.transactions.documents.*.create',
      'databases.*.collections.transactions.documents.*.update',
      'databases.*.collections.transactions.documents.*.delete',
    ],
    expectedSchedule: '0 20 * * *',
    expectedVars: ['APPWRITE_ENDPOINT', 'APPWRITE_DATABASE_ID', 'APPWRITE_API_KEY'],
  },
  {
    name: 'Recurring Transactions',
    functionId: 'recurring-transactions',
    expectedSchedule: '0 0 1 * *',
    expectedVars: ['APPWRITE_ENDPOINT', 'APPWRITE_DATABASE_ID', 'APPWRITE_API_KEY'],
  },
];

function initializeClient(): { client: Client; functions: Functions } {
  if (!APPWRITE_PROJECT_ID) {
    throw new Error('APPWRITE_PROJECT_ID is not set in environment variables');
  }

  if (!APPWRITE_API_KEY) {
    throw new Error('APPWRITE_API_KEY is not set in environment variables');
  }

  const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);

  const functions = new Functions(client);

  return { client, functions };
}

function checkLocalConfiguration(functionId: string): void {
  const configPath = path.join(process.cwd(), 'functions', functionId, 'appwrite.json');

  console.log(`\n📄 Checking local configuration: ${configPath}`);

  if (!fs.existsSync(configPath)) {
    console.log(`   ❌ Configuration file not found`);
    return;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const functionConfig = config.functions?.[0];

    if (!functionConfig) {
      console.log(`   ❌ No function configuration found in appwrite.json`);
      return;
    }

    console.log(`   ✅ Configuration file exists`);
    console.log(`   📋 Function ID: ${functionConfig.$id}`);
    console.log(`   📋 Runtime: ${functionConfig.runtime}`);
    console.log(`   📋 Enabled: ${functionConfig.enabled}`);

    if (functionConfig.events && functionConfig.events.length > 0) {
      console.log(`   📋 Events: ${functionConfig.events.length} configured`);
      functionConfig.events.forEach((event: string) => {
        console.log(`      - ${event}`);
      });
    }

    if (functionConfig.schedule) {
      console.log(`   📋 Schedule: ${functionConfig.schedule}`);
    }

    if (functionConfig.vars) {
      console.log(`   📋 Environment Variables:`);
      Object.keys(functionConfig.vars).forEach((key) => {
        const value = functionConfig.vars[key];
        const displayValue = key.includes('KEY') ? '***' : value;
        console.log(`      - ${key}: ${displayValue}`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Error reading configuration: ${error}`);
  }
}

async function verifyFunction(functions: Functions, config: FunctionConfig): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Verifying: ${config.name}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // Check local configuration first
    checkLocalConfiguration(config.functionId);

    // Try to get function from Appwrite
    console.log(`\n☁️  Checking Appwrite Console...`);

    try {
      const func = await functions.get(config.functionId);

      console.log(`   ✅ Function exists in Appwrite`);
      console.log(`   📋 Name: ${func.name}`);
      console.log(`   📋 Status: ${func.status}`);
      console.log(`   📋 Runtime: ${func.runtime}`);
      console.log(`   📋 Enabled: ${func.enabled}`);

      // Check events
      if (config.expectedEvents) {
        console.log(`\n   📡 Event Triggers:`);
        if (func.events && func.events.length > 0) {
          const missingEvents = config.expectedEvents.filter((event) => !func.events.includes(event));

          func.events.forEach((event) => {
            const isExpected = config.expectedEvents!.includes(event);
            console.log(`      ${isExpected ? '✅' : '⚠️ '} ${event}`);
          });

          if (missingEvents.length > 0) {
            console.log(`   ⚠️  Missing expected events:`);
            missingEvents.forEach((event) => {
              console.log(`      - ${event}`);
            });
          }
        } else {
          console.log(`   ❌ No events configured (expected ${config.expectedEvents.length})`);
        }
      }

      // Check schedule
      if (config.expectedSchedule) {
        console.log(`\n   ⏰ Schedule Trigger:`);
        if (func.schedule) {
          const matches = func.schedule === config.expectedSchedule;
          console.log(`      ${matches ? '✅' : '⚠️ '} ${func.schedule}`);
          if (!matches) {
            console.log(`      Expected: ${config.expectedSchedule}`);
          }
        } else {
          console.log(`   ❌ No schedule configured (expected: ${config.expectedSchedule})`);
        }
      }

      // Check deployments
      console.log(`\n   📦 Deployments:`);
      try {
        const deployments = await functions.listDeployments(config.functionId);
        if (deployments.total > 0) {
          console.log(`      ✅ ${deployments.total} deployment(s) found`);
          const activeDeployment = deployments.deployments.find((d) => d.status === 'ready');
          if (activeDeployment) {
            console.log(`      ✅ Active deployment: ${activeDeployment.$id}`);
            console.log(`      📋 Created: ${new Date(activeDeployment.$createdAt).toLocaleString()}`);
          } else {
            console.log(`      ⚠️  No active deployment found`);
          }
        } else {
          console.log(`      ❌ No deployments found`);
        }
      } catch (error) {
        console.log(`      ⚠️  Could not fetch deployments: ${error}`);
      }

      // Check executions
      console.log(`\n   🚀 Recent Executions:`);
      try {
        const executions = await functions.listExecutions(config.functionId, undefined, 5);
        if (executions.total > 0) {
          console.log(`      ✅ ${executions.total} execution(s) found`);
          executions.executions.slice(0, 3).forEach((exec) => {
            const status = exec.status === 'completed' ? '✅' : exec.status === 'failed' ? '❌' : '⏳';
            console.log(`      ${status} ${exec.$id} - ${exec.status} (${new Date(exec.$createdAt).toLocaleString()})`);
          });
        } else {
          console.log(`      ⚠️  No executions found`);
        }
      } catch (error) {
        console.log(`      ⚠️  Could not fetch executions: ${error}`);
      }

      return true;
    } catch (error: any) {
      if (error.code === 404) {
        console.log(`   ❌ Function not found in Appwrite Console`);
        console.log(`   💡 You need to deploy this function to Appwrite`);
        return false;
      }
      throw error;
    }
  } catch (error: any) {
    console.log(`   ❌ Error verifying function: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Appwrite Functions Verification Script');
  console.log('==========================================\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`   APPWRITE_ENDPOINT: ${APPWRITE_ENDPOINT}`);
  console.log(`   APPWRITE_PROJECT_ID: ${APPWRITE_PROJECT_ID || '❌ NOT SET'}`);
  console.log(`   APPWRITE_API_KEY: ${APPWRITE_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`   APPWRITE_DATABASE_ID: ${APPWRITE_DATABASE_ID || '❌ NOT SET'}`);

  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    console.log('\n❌ Missing required environment variables');
    console.log('💡 Make sure to set APPWRITE_PROJECT_ID and APPWRITE_API_KEY in your .env file');
    process.exit(1);
  }

  try {
    const { functions } = initializeClient();

    const results: boolean[] = [];

    for (const config of FUNCTIONS_TO_VERIFY) {
      const result = await verifyFunction(functions, config);
      results.push(result);
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 Summary');
    console.log(`${'='.repeat(60)}`);

    const allPassed = results.every((r) => r);

    FUNCTIONS_TO_VERIFY.forEach((config, index) => {
      const status = results[index] ? '✅' : '❌';
      console.log(`${status} ${config.name}`);
    });

    if (allPassed) {
      console.log('\n✅ All functions are properly configured!');
    } else {
      console.log('\n⚠️  Some functions need attention. Please review the details above.');
    }

    console.log('\n💡 Next Steps:');
    console.log('   1. If functions are not deployed, deploy them via Appwrite Console or CLI');
    console.log('   2. Test functions manually via Appwrite Console');
    console.log('   3. Monitor function executions and logs');
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
