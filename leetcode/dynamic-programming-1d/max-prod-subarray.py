# Maximum Product Subarray
# https://leetcode.com/problems/maximum-product-subarray

class Solution:
    def maxProduct(self, nums: List[int]) -> int:
        result = max(nums)
        current_max = nums[0]
        current_min = nums[0]

        for num in nums[1:]:
            temp_max = current_max
            current_max = max(current_max * num, current_min * num, num)
            current_min = min(current_min * num, temp_max * num, num)
            result = max(result, current_max)
        
        return result