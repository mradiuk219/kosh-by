import {
  GET as getSubmissions,
  PATCH as patchSubmission,
} from '../../submissions/route';

export async function GET(request: Request) {
  return getSubmissions(request);
}

export async function PATCH(request: Request) {
  return patchSubmission(request);
}
