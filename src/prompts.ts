import {type Inputs} from './inputs'

export class Prompts {
  summarize: string
  summarizeReleaseNotes: string

  summarizeFileDiff = `## GitHub PR Title

\`$title\` 

## Description

\`\`\`
$description
\`\`\`

## Diff File
$filename

## Diff

\`\`\`diff
$file_diff
\`\`\`

## Instructions

I would like you to review the above patch carefully and identify the causes of the changes. The patch could have multiple kinds of causes. You should recognize and categorize them, then list them in the response.

Your response must strictly follow the format below, and keep descending order on \`count\`:

\`\`\`
[Pattern #N]: <The pattern, use one pattern to represent all the similar patterns for the similar diffs. should use \`X => Y\` format>
[Cause #N]: <The cause, use one cause to represent all the similar diffs and causes, describe it in about 80 words, better to have evidence or links to support it>
[Files]: <The file name of this diff, mentioned in the section "Diff File">
[Count]: <The count of similar diffs which share these similar patterns and causes>
\`\`\`

For example:
\`\`\`diff
@@
-  signature: 'a + b'
+  signature: 'a - b'
@@
-  signature: 'c * d'
+  signature: 'c / d'
@@
-  signature: 'e + f'
+  signature: 'e - f'
@@
-  signature: 'g * h'
+  signature: 'g / h'
\`\`\`

Expected Response:

Pattern #1: x + y => x - y
Cause #1: This change updated the add operator to subtraction operator.
Count: 2

Pattern #2: x * y => x / y
Cause #2: This change updated the multiple operator to divide operator.
Count: 2
`
  triageFileDiff = ''

  summarizeChangesets = `Provided below are changesets in this pull request. Changesets 
are in chronlogical order and new changesets are appended to the
end of the list. The format consists of filename(s) and the summary 
of changes for those files. There is a separator between each changeset.
Your task is to deduplicate and group together files with
related/similar changes into a single changeset. Respond with the updated 
changesets using the same format as the input. 

$raw_summary
`

  summarizeCauses = `Keep in mind that a \`cause\` is an object that consist of the following fields:
\`\`\`
Pattern #N: 
Cause #N: 
Files: 
Count: 
\`\`\`

Provided below are the \`cause\` list that lead to the changes of this pull request. Newly added \`cause\` are appended to the end of the list.
\`\`\`
$raw_Causes
\`\`\`

Your task is deduplicate and group together the related/similar \`cause\` into a single \`cause\`. When you find duplicated \`cause\`, you should follow the rules to create a merged \`cause\`:
* Do not merge causes that have not similar \`Pattern\`
* \`Cause\` should be summarized from the duplicated \`causes\`. 
* The merged \`cause\` should have only one \`Pattern\` that is abstracted from the duplicated \`causes\`. You can use some place holder to represent a generic abstracted pattern. For examples,
  when you find two duplcated casue with pattern \`Optional[str] => str | None\` and \`Optional[int] => int | None\`, you can create a generic abstracted pattern \`Optional[type] => type | None\`.
  when you find two duplcated casue with pattern \`azure.storage.blob._models.X => X\` and \`azure.storage.blob._blob_client.BlobClient => BlobClient\`, you can create a generic abstracted pattern \`FullPath.Classname => Classname\`.
* \`Files\` should be merged from the duplicated \`causes\`.
* \`Count\` should be sum up from the duplicated \`causes\`.

Your response is the updated \`cause\` list. Please follow the rules:
* The list should be strictly ordered by the field \`Count\` of each \`cause\` , from large to small.
* Do not provide addtional words like summary or investigation. The response should follow \`cause\` format.
  \`\`\`
  Pattern #N: 
  Cause #N: 
  Files: 
  Count: 
  \`\`\`
`

  summarizePrefix = `Here is the summary of changes you have generated for files:
      \`\`\`
      $raw_summary
      \`\`\`

`

  summarizeShort = `Your task is to provide a concise summary of the changes. This 
summary will be used as a prompt while reviewing each file and must be very clear for 
the AI bot to understand. 

Instructions:

- Focus on summarizing only the changes in the PR and stick to the facts.
- Do not provide any instructions to the bot on how to perform the review.
- Do not mention that files need a through review or caution about potential issues.
- Do not mention that these changes affect the logic or functionality of the code.
- The summary should not exceed 500 words.
`

  reviewFileDiff = `## GitHub PR Title

\`$title\` 

## Description

\`\`\`
$description
\`\`\`

## Summary of changes

\`\`\`
$short_summary
\`\`\`

## IMPORTANT Instructions

Input: New hunks annotated with line numbers and old hunks (replaced code). Hunks represent incomplete code fragments.
Additional Context: PR title, description, summaries and comment chains.
Task: Review new hunks for substantive issues using provided context and respond with comments if necessary.
Output: Review comments in markdown with exact line number ranges in new hunks. Start and end line numbers must be within the same hunk. For single-line comments, start=end line number. Must use example response format below.
Use fenced code blocks using the relevant language identifier where applicable.
Don't annotate code snippets with line numbers. Format and indent code correctly.
Do not use \`suggestion\` code blocks.
For fixes, use \`diff\` code blocks, marking changes with \`+\` or \`-\`. The line number range for comments with fix snippets must exactly match the range to replace in the new hunk.

- Do NOT provide general feedback, summaries, explanations of changes, or praises 
  for making good additions. 
- Focus solely on offering specific, objective insights based on the 
  given context and refrain from making broad comments about potential impacts on 
  the system or question intentions behind the changes.

If there are no issues found on a line range, you MUST respond with the 
text \`LGTM!\` for that line range in the review section. 

## Example

### Example changes

---new_hunk---
\`\`\`
  z = x / y
    return z

20: def add(x, y):
21:     z = x + y
22:     retrn z
23: 
24: def multiply(x, y):
25:     return x * y

def subtract(x, y):
  z = x - y
\`\`\`
  
---old_hunk---
\`\`\`
  z = x / y
    return z

def add(x, y):
    return x + y

def subtract(x, y):
    z = x - y
\`\`\`

---comment_chains---
\`\`\`
Please review this change.
\`\`\`

---end_change_section---

### Example response

22-22:
There's a syntax error in the add function.
\`\`\`diff
-    retrn z
+    return z
\`\`\`
---
24-25:
LGTM!
---

## Changes made to \`$filename\` for your review

$patches
`

  comment = `A comment was made on a GitHub PR review for a 
diff hunk on a file - \`$filename\`. I would like you to follow 
the instructions in that comment. 

## GitHub PR Title

\`$title\`

## Description

\`\`\`
$description
\`\`\`

## Summary generated by the AI bot

\`\`\`
$short_summary
\`\`\`

## Entire diff

\`\`\`diff
$file_diff
\`\`\`

## Diff being commented on

\`\`\`diff
$diff
\`\`\`

## Instructions

Please reply directly to the new comment (instead of suggesting 
a reply) and your reply will be posted as-is.

If the comment contains instructions/requests for you, please comply. 
For example, if the comment is asking you to generate documentation 
comments on the code, in your reply please generate the required code.

In your reply, please make sure to begin the reply by tagging the user 
with "@user".

## Comment format

\`user: comment\`

## Comment chain (including the new comment)

\`\`\`
$comment_chain
\`\`\`

## The comment/request that you need to directly reply to

\`\`\`
$comment
\`\`\`
`

  constructor(summarize = '', summarizeReleaseNotes = '') {
    this.summarize = summarize
    this.summarizeReleaseNotes = summarizeReleaseNotes
  }

  renderSummarizeFileDiff(
    inputs: Inputs,
    reviewSimpleChanges: boolean
  ): string {
    let prompt = this.summarizeFileDiff
    if (reviewSimpleChanges === false) {
      prompt += this.triageFileDiff
    }
    return inputs.render(prompt)
  }

  renderSummarizeChangesets(inputs: Inputs): string {
    return inputs.render(this.summarizeChangesets)
  }
  
  renderSummarizeCauses(inputs: Inputs): string {
    return inputs.render(this.summarizeCauses)
  }

  renderSummarize(inputs: Inputs): string {
    const prompt = this.summarizePrefix + this.summarize
    return inputs.render(prompt)
  }

  renderSummarizeShort(inputs: Inputs): string {
    const prompt = this.summarizePrefix + this.summarizeShort
    return inputs.render(prompt)
  }

  renderSummarizeReleaseNotes(inputs: Inputs): string {
    const prompt = this.summarizePrefix + this.summarizeReleaseNotes
    return inputs.render(prompt)
  }

  renderComment(inputs: Inputs): string {
    return inputs.render(this.comment)
  }

  renderReviewFileDiff(inputs: Inputs): string {
    return inputs.render(this.reviewFileDiff)
  }
}
