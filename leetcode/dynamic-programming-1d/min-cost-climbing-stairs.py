# Min Cost Climbing Stairs
# https://leetcode.com/problems/min-cost-climbing-stairs/

class Solution:
  def minCostClimbingStairs(self, cost: List[int]) -> int:
    one, two = cost[-2:]

    for i in range(len(cost) - 2):
      current_step_cost = cost[len(cost) - 3 - i]
      temp = one
      one = min(one, two) + current_step_cost
      two = temp

    return min(one, two)