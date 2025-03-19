import { type NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"

// Bu fonksiyon EVM uyumlu 0G ağına token gönderir
async function send0GTokens(address: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Private key'i environment variable olarak alın
    const privateKey = process.env.WALLET_PRIVATE_KEY
    const rpcUrl = process.env.RPC_URL

    if (!privateKey) {
      throw new Error("Wallet private key is not configured")
    }

    if (!rpcUrl) {
      throw new Error("RPC URL is not configured")
    }

    // EVM uyumlu provider oluştur
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Wallet oluştur
    const wallet = new ethers.Wallet(privateKey, provider)

    // Gönderilecek miktar (0.1 token)
    // EVM'de değerler wei cinsinden (10^18) olduğu için 0.1 tokeni wei'ye çeviriyoruz
    const amount = ethers.parseEther("0.1")

    // İşlem parametreleri
    const tx = {
      to: address,
      value: amount,
      gasLimit: 21000, // Basit bir transfer için standart gas limiti
    }

    // İşlemi gönder
    const transaction = await wallet.sendTransaction(tx)

    // İşlem hash'ini al
    const txHash = transaction.hash

    console.log(`Transaction sent: ${txHash}`)

    return {
      success: true,
      txHash,
    }
  } catch (error) {
    console.error("Token gönderme hatası:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json({ success: false, error: "Adres gerekli" }, { status: 400 })
    }

    // EVM adresi doğrulama (0x ile başlayan 42 karakter)
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json({ success: false, error: "Geçersiz EVM adresi formatı" }, { status: 400 })
    }

    // Rate limiting (IP bazlı veya adres bazlı)
    // Bu kısım gerçek uygulamada daha karmaşık olacaktır

    // Token gönderme işlemi
    const result = await send0GTokens(address)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "0.1 0G başarıyla gönderildi",
        txHash: result.txHash,
      })
    } else {
      return NextResponse.json({ success: false, error: result.error || "Token gönderimi başarısız" }, { status: 500 })
    }
  } catch (error) {
    console.error("API hatası:", error)
    return NextResponse.json({ success: false, error: "Sunucu hatası" }, { status: 500 })
  }
}

