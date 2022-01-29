import {
  Field,
  SmartContract,
  method,
  Bool,
  state,
  State,
  UInt64,
  isReady,
  PrivateKey,
  Mina,
  Party,
  PublicKey,
} from 'snarkyjs';
import type { SecretNumberSnappInterface } from '../global';

export class SecretNumberSnapp extends SmartContract {
  @state(Field) n = State<Field>();
  @state(Bool) isCorrect = State<Bool>();

  deploy(initialBalance: UInt64, n: number) {
    super.deploy();
    this.balance.addInPlace(initialBalance);
    this.n.set(new Field(n));
    this.isCorrect.set(Bool(false));
  }

  @method async submitGuess(
    n: number
  ) {
    const stateN = await this.n.get();
    stateN.assertEquals(n);

    this.isCorrect.set(Bool(true));
  }

  @method async resetPuzzle(
    n: number
  ) {
    const isCorrect = await this.isCorrect.get();
    isCorrect.assertEquals(true);

    await this.isCorrect.set(Bool(false));
    await this.n.set(new Field(n));
  }
}

export async function deploy(n: number) {
  await isReady;

  const snappPrivkey = PrivateKey.random();
  const snappAddress = snappPrivkey.toPublicKey();
  const snapp = new SecretNumberSnapp(snappAddress);

  const snappInterface: SecretNumberSnappInterface = {
    submitGuess(n: number) {
      return submitGuess(snappAddress, n);
    },
    resetPuzzle(n: number) {
      return resetPuzzle(snappAddress, n);
    },
    getSnappState() {
      return getSnappState(snappAddress);
    },
  };

  const tx = Mina.transaction(DEPLOYER_ACCOUNT, async () => {
    console.log('Deploying Secret Number Snapp...');
    const p = await Party.createSigned(USER_ACCOUNT);
    p.balance.subInPlace(ONE_MINA);
    snapp.deploy(ONE_MINA, n);
  });
  await tx.send().wait();

  console.log('Deployed...')
  return snappInterface;
}

export async function submitGuess(snappAddress: PublicKey, n: number) {
  await isReady;

  const snapp = new SecretNumberSnapp(snappAddress);
  const tx = Mina.transaction(USER_ACCOUNT, async () => {
    console.log('Submitting guess...');
    await snapp.submitGuess(n);
  });
  try {
    await tx.send().wait();
  } catch (err) {
    console.log('Incorrect Guess!');
  }
}

export async function resetPuzzle(snappAddress: PublicKey, n: number) {
  await isReady;

  const snapp = new SecretNumberSnapp(snappAddress);
  const tx = Mina.transaction(USER_ACCOUNT, async () => {
    console.log('Resetting puzzle...');
    await snapp.resetPuzzle(n);
  });
  try {
    await tx.send().wait();
  } catch (err) {
    console.log('Unable to reset! (Is the puzzle in a solved state?');
  }
}

export async function getSnappState(snappAddress: PublicKey) {
  await isReady;

  const snappState = (await Mina.getAccount(snappAddress)).snapp.appState;
  const n = snappState[0];
  const isCorrect = snappState[1].equals(true).toBoolean();
  return { n, isCorrect };
}

export async function load() {
  await isReady;
}


/*
Local MINA blockchain config for the purposes of running dev.

This code is not a replacement for, nor does it interact with the MINA blockchain mainnet.
*/

let Local;
let accounts: PrivateKey[];
let DEPLOYER_ACCOUNT: PrivateKey;
let USER_ACCOUNT: PrivateKey;
let ONE_MINA: UInt64;

isReady.then(() => {
  Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  accounts = Local.testAccounts.map(account => account.privateKey);
  DEPLOYER_ACCOUNT = accounts[0];
  USER_ACCOUNT = accounts[1];
  ONE_MINA = UInt64.fromNumber(1000000);
})

