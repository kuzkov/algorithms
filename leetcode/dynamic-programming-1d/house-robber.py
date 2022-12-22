# House Robber
# https://leetcode.com/problems/house-robber

class Solution:
  def rob(self, nums: List[int]) -> int:
    one, two = nums[-1], 0
    
    for i in range(1, len(nums)):
      house_value = nums[-(i + 1)]
      temp = one
      one = max(house_value + two, one)
      two = temp

    return one