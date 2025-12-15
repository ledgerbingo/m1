module meridian::staking {
    use aptos_framework::coin;

    public struct StakeReceipt<CoinType> has store (
        coin::Coin<CoinType>
    );

    public fun deposit<CoinType>(coins: coin::Coin<CoinType>): StakeReceipt<CoinType> {
        StakeReceipt<CoinType>(coins)
    }

    public fun redeem<CoinType>(receipt: StakeReceipt<CoinType>): coin::Coin<CoinType> {
        let StakeReceipt<CoinType>(coins) = receipt;
        coins
    }
}

module echelon::lending {
    use aptos_framework::coin;

    public struct LendReceipt<CoinType> has store (
        coin::Coin<CoinType>
    );

    public fun deposit<CoinType>(coins: coin::Coin<CoinType>): LendReceipt<CoinType> {
        LendReceipt<CoinType>(coins)
    }

    public fun redeem<CoinType>(receipt: LendReceipt<CoinType>): coin::Coin<CoinType> {
        let LendReceipt<CoinType>(coins) = receipt;
        coins
    }
}
