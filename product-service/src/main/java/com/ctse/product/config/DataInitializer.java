package com.ctse.product.config;

import com.ctse.product.entity.Product;
import com.ctse.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) {
            return; // Already initialized
        }

        List<Product> products = List.of(
            Product.builder()
                .name("Ultra HDTV 55\" 4K")
                .description("Stunning 4K OLED display with HDR10+, 120Hz refresh rate, and built-in smart OS.")
                .price(new BigDecimal("1299.99"))
                .stockQuantity(25)
                .category("Electronics")
                .imageUrl("https://images.unsplash.com/photo-1593359677879-a4bb92f4834a?w=400")
                .build(),
            Product.builder()
                .name("Mechanical Gaming Keyboard")
                .description("TKL layout, Cherry MX Blue switches, per-key RGB, USB-C detachable cable.")
                .price(new BigDecimal("149.99"))
                .stockQuantity(80)
                .category("Peripherals")
                .imageUrl("https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400")
                .build(),
            Product.builder()
                .name("Wireless Noise-Cancelling Headphones")
                .description("40-hour battery life, ANC, Hi-Res Audio certified, foldable design.")
                .price(new BigDecimal("349.99"))
                .stockQuantity(50)
                .category("Audio")
                .imageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400")
                .build(),
            Product.builder()
                .name("Ergonomic Office Chair")
                .description("Lumbar support, breathable mesh, adjustable armrests, 5-year warranty.")
                .price(new BigDecimal("499.99"))
                .stockQuantity(15)
                .category("Furniture")
                .imageUrl("https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400")
                .build(),
            Product.builder()
                .name("MacBook Pro M3 16\"")
                .description("Apple M3 Pro chip, 36GB unified memory, 512GB SSD, Liquid Retina XDR display.")
                .price(new BigDecimal("2499.99"))
                .stockQuantity(10)
                .category("Computers")
                .imageUrl("https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400")
                .build(),
            Product.builder()
                .name("Smartphone Pro Max 15")
                .description("6.7\" Super AMOLED, 200MP camera system, 5000mAh battery, IP68 waterproof.")
                .price(new BigDecimal("1099.99"))
                .stockQuantity(40)
                .category("Mobile")
                .imageUrl("https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400")
                .build(),
            Product.builder()
                .name("4K Webcam Pro")
                .description("4K 30fps, AI-powered auto-framing, built-in ring light, USB-C, plug-and-play.")
                .price(new BigDecimal("199.99"))
                .stockQuantity(60)
                .category("Peripherals")
                .imageUrl("https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400")
                .build(),
            Product.builder()
                .name("Smart Home Hub")
                .description("Matter and Thread compatible, controls 100+ devices, touchscreen display, local processing.")
                .price(new BigDecimal("129.99"))
                .stockQuantity(35)
                .category("Smart Home")
                .imageUrl("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400")
                .build(),
            Product.builder()
                .name("SSD 2TB NVMe Gen5")
                .description("Read speeds up to 12,000 MB/s, M.2 2280, perfect for gaming and content creation.")
                .price(new BigDecimal("219.99"))
                .stockQuantity(90)
                .category("Storage")
                .imageUrl("https://images.unsplash.com/photo-1597225244516-7b10b55b5d0b?w=400")
                .build(),
            Product.builder()
                .name("Gaming Mouse 16K DPI")
                .description("PAW3395 sensor, 95g lightweight, 6 programmable buttons, 70-hour battery life.")
                .price(new BigDecimal("89.99"))
                .stockQuantity(120)
                .category("Peripherals")
                .imageUrl("https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400")
                .build(),
            Product.builder()
                .name("Standing Desk 180cm")
                .description("Dual-motor electric height adjustment, memory presets, cable management, anti-collision.")
                .price(new BigDecimal("799.99"))
                .stockQuantity(8)
                .category("Furniture")
                .imageUrl("https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400")
                .build(),
            Product.builder()
                .name("Portable Power Station 1000W")
                .description("1024Wh capacity, 11 output ports, 2x200W solar input, LiFePO4 battery, LED display.")
                .price(new BigDecimal("899.99"))
                .stockQuantity(20)
                .category("Power")
                .imageUrl("https://images.unsplash.com/photo-1620231150876-f4cf02bc8e36?w=400")
                .build()
        );

        productRepository.saveAll(products);
        System.out.println("[Product Service] Seeded " + products.size() + " sample products.");
    }
}
