# Longest Palindromic Substring
# https://leetcode.com/problems/longest-palindromic-substring

class Solution:
    def longestPalindrome(self, s: str) -> str:
        res = ""
        maxRes = ""

        for i in range(len(s)):
            l, r = i, i
            while 0 <= (l-1) and (r+1) < len(s) and s[l-1] == s[r+1]:    
                l -= 1
                r += 1

            res = s[l:r+1]
            if len(res) > len(maxRes):
                maxRes = res
            
            l, r = i, i+1
            if r < len(s) and s[l] == s[r]:
                while 0 <= (l-1) and (r+1) < len(s) and s[l-1] == s[r+1]:    
                    l -= 1
                    r += 1

                res = s[l:r+1]
                if len(res) > len(maxRes):
                    maxRes = res

        return maxRes