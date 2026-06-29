import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { VerificationService } from './verification.service';

@Controller()
export class VerificationController {
  constructor(private readonly svc: VerificationService) {}

  @Post('proofs')
  createProof(@Body() body: { badgeId: string; owner: string; ttlSeconds?: number }) {
    return this.svc.generateProof(body.badgeId, body.owner, body.ttlSeconds);
  }

  @Get('proofs/:id')
  getProof(@Param('id') id: string) {
    return this.svc.getProof(id) || { error: 'not_found' };
  }

  @Post('proofs/:id/revoke')
  revoke(@Param('id') id: string) {
    return { ok: this.svc.revokeProof(id) };
  }

  @Post('proofs/:id/commit')
  commit(@Param('id') id: string) {
    const tx = this.svc.commitOnChain(id);
    return { txHash: tx };
  }

  @Get('verify/:id')
  verify(@Param('id') id: string) {
    return this.svc.verifyProof(id);
  }

  @Get('share/:id')
  share(@Param('id') id: string) {
    const p = this.svc.getProof(id);
    if (!p) return { error: 'not_found' };
    // simple share link
    return { link: `/badge-verification-service/share/${id}`, proof: p };
  }
}
