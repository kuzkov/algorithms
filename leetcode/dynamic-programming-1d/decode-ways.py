# Decode Ways
# https://leetcode.com/problems/decode-ways/

class Solution:
    def numDecodings(self, s: str) -> int:
        one, two = 1, 1

        if s[0] == '0':
            return 0

        for i in range(1, len(s)):
            count_of_ways = 0

            if s[i-1] == '1' or \
               (s[i-1] == '2' and '0' <= s[i] and s[i] <= '6') and \
               (i == (len(s)-1) or s[i+1] != '0'):
                count_of_ways += one
            
            if s[i] != '0':
                count_of_ways += two
            
            one, two = two, count_of_ways

        return two