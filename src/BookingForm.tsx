import { useState } from "react";

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  onSubmit: () => void;
}

export function BookingForm({ selectedDate, selectedTime, onSubmit }: BookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [duration, setDuration] = useState(60);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      email,
      phone,
      duration,
      date: selectedDate.toISOString().split("T")[0],
      time: selectedTime,
    };

    try {
      const response = await fetch("http://localhost:5000/book-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Prenotazione avvenuta con successo!");
        onSubmit();
      } else {
        alert("Errore: " + data.error);
      }
    } catch (error) {
      alert("Errore di rete");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Prenotazione per il {selectedDate.toLocaleDateString()} alle {selectedTime}</h2>

      <label>
        Nome:
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <br />

      <label>
        Email:
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <br />

      <label>
        Telefono:
        <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </label>
      <br />

      <label>
        Durata (minuti):
        <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={30} max={120} step={30} />
      </label>
      <br />

      <button type="submit">Prenota</button>
    </form>
  );
}
