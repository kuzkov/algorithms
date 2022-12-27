# Coin Change
# https://leetcode.com/problems/coin-change/

class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        dp = [0]

        for current_amount in range(1, amount + 1):
            counts = []

            for coin_value in coins:
                if current_amount - coin_value >= 0 and \
                   dp[current_amount - coin_value] != -1:
                    counts.append(dp[current_amount - coin_value])

            dp.append(-1 if len(counts) == 0 else min(counts) + 1)

        return dp[amount]