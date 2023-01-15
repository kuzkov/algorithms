# Word Break
# https://leetcode.com/problems/word-break/

class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        can_be_segmented = [True]

        for index, letter in enumerate(s, start=1):
            for word in wordDict:
                if len(word) > index:
                    continue
                
                start_index = index - len(word)
                
                if can_be_segmented[start_index] and s[start_index : index] == word:
                    can_be_segmented.append(True)
                    break
            else:
                can_be_segmented.append(False)
        
        return can_be_segmented[-1]
