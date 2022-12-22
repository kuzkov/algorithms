# House Robber II
# https://leetcode.com/problems/house-robber-ii/

class Solution:
  def linear_rob(self, nums: List[int]) -> int:
    one, two = nums[-1], 0
    
    for i in range(1, len(nums)):
      house_value = nums[-(i + 1)]
      temp = one
      one = max(house_value + two, one)
      two = temp

    return one

  def rob(self, nums: List[int]) -> int:
    if len(nums) == 1:
      return nums[0]
    
    one = self.linear_rob(nums[1:])
    two = self.linear_rob(nums[:-1])

    return max(one, two)
