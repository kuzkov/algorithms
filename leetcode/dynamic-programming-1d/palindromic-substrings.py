# Palindromic Substrings
# https://leetcode.com/problems/palindromic-substrings

class Solution:
    def countSubstrings(self, s: str) -> int:
        count = 0

        for i in range(len(s)):
            l, r = i, i
            count += 1
            while 0 <= (l-1) and (r+1) < len(s) and s[l-1] == s[r+1]:    
                l -= 1
                r += 1
                count += 1
            
            l, r = i, i+1
            if r < len(s) and s[l] == s[r]:
                count += 1
                while 0 <= (l-1) and (r+1) < len(s) and s[l-1] == s[r+1]:    
                    l -= 1
                    r += 1
                    count += 1

        return count