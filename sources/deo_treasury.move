module deo::treasury {
    use std::signer;
    use std::vector;
    use movement_framework::coin;
    use movement_framework::event;
    use movement_framework::timestamp;

    use deo::usdc;
    use meridian::staking;
    use echelon::lending;

    public enum PaymentStatus has copy, drop, store {
        Pending,
        Authorized,
        Settled(u64),
        Disputed,
    }

    public struct Payment has store (
        u64, // id
        address, // merchant
        u64, // amount
        PaymentStatus,
    );

    public struct PaymentEvent has drop, store {
        payer: address,
        merchant: address,
        amount: u64,
        payment_id: u64,
        settled_at: u64,
    }

    public struct Treasury has key {
        idle: coin::Coin<usdc::USDC>,
        meridian: vector<staking::StakeReceipt<usdc::USDC>>,
        echelon: vector<lending::LendReceipt<usdc::USDC>>,
        payments: vector<Payment>,
        next_payment_id: u64,
        payment_events: event::EventHandle<PaymentEvent>,
    }

    const E_TREASURY_EXISTS: u64 = 1;
    const E_TREASURY_MISSING: u64 = 2;
    const E_INSUFFICIENT_FUNDS: u64 = 3;

    fun merge(self: coin::Coin<usdc::USDC>, other: coin::Coin<usdc::USDC>): coin::Coin<usdc::USDC> {
        coin::merge(self, other)
    }

    fun extract(self: &mut coin::Coin<usdc::USDC>, amount: u64): coin::Coin<usdc::USDC> {
        coin::extract(self, amount)
    }

    fun deposit_to(self: address, coins: coin::Coin<usdc::USDC>) {
        coin::deposit(self, coins)
    }

    public entry fun init_treasury(agent: signer) {
        let agent_addr = signer::address_of(&agent);
        assert!(!exists<Treasury>(agent_addr), E_TREASURY_EXISTS);

        let t = Treasury {
            idle: coin::zero<usdc::USDC>(),
            meridian: vector::empty<staking::StakeReceipt<usdc::USDC>>(),
            echelon: vector::empty<lending::LendReceipt<usdc::USDC>>(),
            payments: vector::empty<Payment>(),
            next_payment_id: 0,
            payment_events: event::new_event_handle<PaymentEvent>(&agent),
        };

        move_to(&agent, t);
    }

    public entry fun deposit(agent: signer, amount: u64) acquires Treasury {
        let agent_addr = signer::address_of(&agent);
        assert!(exists<Treasury>(agent_addr), E_TREASURY_MISSING);

        let coins = coin::withdraw<usdc::USDC>(&agent, amount);
        let t = borrow_global_mut<Treasury>(agent_addr);
        t.idle = t.idle.merge(coins);
    }

    public entry fun route_idle(agent: signer, meridian_amount: u64, echelon_amount: u64) acquires Treasury {
        let agent_addr = signer::address_of(&agent);
        let t = borrow_global_mut<Treasury>(agent_addr);

        if (meridian_amount > 0) {
            let c = t.idle.extract(meridian_amount);
            let r = staking::deposit<usdc::USDC>(c);
            vector::push_back(&mut t.meridian, r);
        };

        if (echelon_amount > 0) {
            let c2 = t.idle.extract(echelon_amount);
            let r2 = lending::deposit<usdc::USDC>(c2);
            vector::push_back(&mut t.echelon, r2);
        };
    }

    fun withdraw_from_yield_if_needed(t: &mut Treasury, needed: u64) {
        let idle_val = coin::value(&t.idle);
        if (idle_val >= needed) {
            return;
        };

        let mut remaining = needed - idle_val;

        while (remaining > 0 && vector::length(&t.meridian) > 0) {
            let r = vector::pop_back(&mut t.meridian);
            let c = staking::redeem<usdc::USDC>(r);
            let v = coin::value(&c);
            t.idle = t.idle.merge(c);
            if (v >= remaining) {
                remaining = 0;
            } else {
                remaining = remaining - v;
            };
        };

        while (remaining > 0 && vector::length(&t.echelon) > 0) {
            let r2 = vector::pop_back(&mut t.echelon);
            let c2 = lending::redeem<usdc::USDC>(r2);
            let v2 = coin::value(&c2);
            t.idle = t.idle.merge(c2);
            if (v2 >= remaining) {
                remaining = 0;
            } else {
                remaining = remaining - v2;
            };
        };

        assert!(coin::value(&t.idle) >= needed, E_INSUFFICIENT_FUNDS);
    }

    public entry fun pay_merchant(agent: signer, merchant: address, amount: u64) acquires Treasury {
        let agent_addr = signer::address_of(&agent);
        let t = borrow_global_mut<Treasury>(agent_addr);

        withdraw_from_yield_if_needed(t, amount);

        let payment_id = t.next_payment_id;
        t.next_payment_id = payment_id + 1;

        let settled_at = timestamp::now_seconds();
        let p = Payment(payment_id, merchant, amount, PaymentStatus::Settled(settled_at));
        vector::push_back(&mut t.payments, p);

        let pay_coins = t.idle.extract(amount);
        merchant.deposit_to(pay_coins);

        event::emit_event(
            &mut t.payment_events,
            PaymentEvent { payer: agent_addr, merchant, amount, payment_id, settled_at }
        );
    }
}

module deo::usdc {
    use std::signer;
    use movement_framework::managed_coin;

    struct USDC has store, drop {}

    public entry fun init(admin: signer) {
        managed_coin::initialize<USDC>(
            &admin,
            b"USD Coin",
            b"USDC",
            6,
            false
        );
    }

    public entry fun register(account: signer) {
        managed_coin::register<USDC>(&account);
    }

    public entry fun mint(admin: signer, dst: address, amount: u64) {
        managed_coin::mint<USDC>(&admin, dst, amount);
    }
}
