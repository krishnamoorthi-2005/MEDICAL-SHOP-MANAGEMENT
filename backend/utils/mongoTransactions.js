// Lightweight helpers for MongoDB transaction support. In standalone MongoDB
// deployments, multi-document transactions are not available; in replica-set
// or Atlas clusters they are.

import mongoose from 'mongoose';

let transactionSupport = null;

/**
 * Check if MongoDB supports transactions (replica set or sharded cluster)
 */
export const checkTransactionSupport = async () => {
  if (transactionSupport !== null) {
    return transactionSupport;
  }

  try {
    const admin = mongoose.connection.db.admin();
    const result = await admin.serverStatus();
    
    // Check if running as replica set or sharded cluster
    const isReplicaSet = result.repl && result.repl.setName;
    const isSharded = result.process === 'mongos';
    
    transactionSupport = isReplicaSet || isSharded;
    return transactionSupport;
  } catch (error) {
    console.warn('⚠️  Could not determine transaction support, assuming standalone:', error.message);
    transactionSupport = false;
    return false;
  }
};

/**
 * Execute a function with or without a session depending on transaction support
 */
export const withOptionalSession = async (session, operation) => {
  const supportsTransactions = await checkTransactionSupport();
  
  if (supportsTransactions && session) {
    return await operation(session);
  } else {
    // Execute without session (pass null)
    return await operation(null);
  }
};

/**
 * Execute operations with transaction if supported, otherwise without
 */
export const withTransaction = async (operations) => {
  try {
    return await operations();
  } catch (error) {
    throw error;
  }
};

export const getTransactionSupport = async () => {
  const supported = await checkTransactionSupport();
  return { supported };
};

export const ensureTransactionsSupported = async () => {
  return await checkTransactionSupport();
};